define('dom', function() {

	var doc = document;

	var rId = /^#[\w-]*$/,						// id
		rTagName = /^[\w]+$/,					// html标签
		rClassName = /^\.[\w-]+/,				// css class 类名
		rTrim = /^\s*|\s*$/,					// 去除空格
		rFragment = /\s*<([\w|!][^>]*)>/,		// 匹配带<开头的html标签名
		rSingleTag = /^<(\w)+\s*\/>(?:\/\1|)$/,	// 匹配单个html标签名
		rTagExpander = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig;
		
	// 检测是否支持classList属性
	var isSupportClassList = 'classList' in doc.body;

	var table = doc.createElement('table'),
		tr = doc.createElement('tr'),
		div = doc.createElement('div'),
		tbody = doc.createElement('tbody'),
		wraps = {'tr': tbody, 'tbody': table, 'thead': table, 'tfoot': table, 'td': tr, 'th': tr, '*': div };

	var methodAttrs = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],
		cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 };

	function Dom(selector, context) {
		return Dom.init(selector, context);
	}

	// 参照zeptojs
	Dom.T = function(dom, selector) {
		dom = dom || [];
		dom.__proto__ = Dom.fn;
		dom.selector = selector || '';
		return dom;
	}

	Dom.isT = function(obj) {
		return obj instanceof Dom.T;
	}

	Dom.init = function(selector, context) {
		var dom;
		if (!selector) return Dom();

		// selector为字符串时
		if (thin.isString(selector)) {
			selector = selector.replace(rTrim, '');
			// selector为html片断时，创建html节点
			if (selector[0] === '<' && rFragment.test(selector)) {
				dom = Dom.fragment(selector, RegExp.$1, context);
				selector = null;
			} else {
				// selector为css选择器
				dom = Dom.query(selector, context);
			}
		} else if (thin.isFunction(selector)) {	// Function类型
			return Dom(document).ready(selector);
		} else if (Dom.isT(selector)) {		// 已经是Dom类型实例
			return selector;
		} else if (typeof selector == 'object') {	// 为节点对象类型
			dom = [selector];
			selector = null;
		} else if (thin.isArray(selector)) {	// 数组类型时
			dom = [].filter.call(selector, function(i){
				return i != null
			});
		}

		// 为thin Dom对象时
		return Dom.T(dom, selector);
	}

	Dom.each = function(elems, callback) {
		var i, key;
		if (typeof elems.length === 'number') {
			for (i=0; i<elems.length; i++) {
				if (callback.call(elems[i], i, elems[i]) === false) return elems;
			}
		} else {
			for (key in elems) {
				if (callback.call(elems[key], key, elems[key]) === false) return elems;
			}
		}
		return elems;
	}

	Dom.map = function(elems, callback) {
		var value, values = [], i, key;

		if (typeof elems.length === 'number') {
			for (i=0; i<elems.length; i++) {
				value = callback(elems[i], i);
				if (value != null) values.push(value);
			}
		} else {
			for (key in elems) {
				value = callback(elems[key], key);
				if (value != null) values.push(value);
			}
		}
		return values;
	}

	Dom.fragment = function(html, name, properties) {
		var dom, wrap, nodes;
		// 单标签类型
		if (rSingleTag.test(html)) {
			dom = Dom(document.createFragment(RegExp.$1))
		}
		if (!dom) {
			html.replace && (html = html.replace(rTagExpander, '<$1></$2>'));
			if (name === undefined) {
				name = rFragment.test(html) && RegExp.$1;
			}
			if (!(name in wraps)) name = '*';
			wrap = wraps[name];
			wrap.innerHTML = '' + html;
			dom = Dom.each(Array.prototype.slice.call(wrap.childNodes), function(){
			  wrap.removeChild(this)
			});
		}
		// 设置属性或css属性
		if (thin.isPlainObject(properties)) {
			nodes = Dom(dom);
			Dom.each(properties, function(key, value) {
				if (methodAttrs.indexOf(key) > -1) {
					nodes[key](value);
				} else {
					nodes.attr(key, value);
				}
			})
		}
		return dom;
	}

	/**
	 * @param {elem} 
	 * @param {selector}
	 * @description 检测dom元素是否匹配选择器selector, 兼容低版本ie6-8实现matchesSelector功能
	 */
	Dom.matches = (function() {
		var body = doc.body;
		var matchesSelector = body.webkitMatchesSelector || body.msMatchesSelector || body.mozMatchesSelector || body.oMatchesSelector;

		var w3cMatches = function(elem, selector) {
			return matchesSelector.call(elem, selector);				
		}
		// 低版本ie
		var ieMatches = function(elem, selector) {
			var parent,
				matches;

			parent = elem.parentNode;
			// 元素已存在DOM文档树中
			if (parent) {
				var len;
				matches = parent.querySelectorAll(selector);
				len = matches.length;
				while(len--) {
					if (matches[len] == elem) {
						return true;
					}
				}
				return false;
			} else {
				var div,
					parentNode;
				// 元素未添加到DOM文档树
				div = doc.createElement('div');
				parentNode = div.appendChild(elem);
				matches = parentNode.querySelector(selector);
				div = null;
				if (matches.length) {
					return true;
				}
				return false;
			}
		}

		return matchesSelector ? w3cMatches : ieMatches;			
	}())

	// 判断父元素是否包含子元素
	Dom.contains = doc.documentElement.contains ? 
		function(parent, node) {
			return parent !== node && parent.contains(node);
		} : 
		function(parent, node) {
			while(node && (node = node.parentNode)) {
				if (node === parent) return true;
			}
			return false;
		}

	// 实现css选择器
	Dom.query = function(selector, context) {
		var result;

		if (!thin.isString(selector)) result = [];
		selector = selector.replace(rTrim, '');
		context = context || doc;

		if (rId.test(selector)) {
			selector = selector.replace('#', '');
			return [doc.getElementById(selector)];
		} else if (rTagName.test(selector)) {
			result = context.getElementsByTagName(selector);
		} else if (rClassName.test(selector)) {
			var tags, i, len, elements = [];
			selector = selector.replace('\.', '');
			if (context.getElementsByClassName) {
				result = context.getElementsByClassName(selector);
			} else {
				tags = this.tagName('*', context);
				for (i=0, len=tags.length; i<len; i++) {
					if (tags[i].className && (' ' + tags[i].className + ' ').indexOf(' ' + selector + '') >= 0) {
						elements.push(tags[i]);
					}
				}
				return elements;
			}
		} else {
			reuslt = context.querySelectorAll(selector);
		}
		// 类数组对象转换为数组对象
		return Array.prototype.slice.call(result);
	}

	Dom.camelize = camelize;

	function filtered(nodes, selector) {
	  return selector == null ? Dom(nodes) : Dom(nodes).filter(selector)
	}
	function uniq(array) {
		return [].filter.call(array, function(item, idx) {
			return array.indexOf(item) == idx;
		})
	}
	function children(element) {
		return 'children' in element ? 
			[].slice.call(element.children) : 
			Dom.map(element.childNodes, function(node) {
				if (node.nodeType == 1) {
					return node;
				}
			})
	}

	function funcArg(context, arg, idx, payload) {
		return thin.isFunction(arg) ? arg.call(context, idx, payload) : arg;
	}

	function camelize(str) {
		return str.replace(/-+(.)?/g, function(match, chr) {
			return chr ? chr.toUpperCase() : ''
		})
	}

	function dasherize(str) {
	  return str.replace(/::/g, '/')
	         .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
	         .replace(/([a-z\d])([A-Z])/g, '$1_$2')
	         .replace(/_/g, '-')
	         .toLowerCase()
	}

	function maybeAddPx(name, value) {
		return (typeof value == 'number' && !cssNumber[dasherize(name)]) ? value + 'px' : value;
	}

	function className(node, value) {
		
	}

	Dom.fn = Dom.prototype = {
		/*********************元素遍历、过滤*************************************/
		each: function(callback) {
			[].every.call(this, function(el, idx) {
				return callback.call(el, idx, el) !== false;
			})
			return this;
		},
		map: function(fn) {
			return Dom(Dom.map(this, function(el, idx) {
				return fn.call(el, idx, el);
			}))
		},
		filter: function(selector) {
			if (thin.isFunction(selector)) {
				return this.not(this.not(selector));
			}
			return Dom([].filter.call(this, function(el) {
				return Dom.matches(el, selector);
			}));
		},
		toArray: function() {
			return this.get();			
		},
		ready: function(callback) {
			if (/complete|loaded|interactive/.test(document.readyState) && doc.body) {
				callback(Dom);
			} else {
				doc.addEventListener('DOMContentLoaded', function() {
					callback(Dom)
				}, false);
			}
			return this;
		},
		slice: function() {
			return Dom([].slice.apply(this, arguments))
		},
		forEach: thin.forEach,
		reduce: [].reduce,
		push: [].push,
		sort: [].sort,
		indexOf: [].indexOf,
		concat: [].concat,
		pluck: function(property) {
			return Dom.map(this, function(el) {
				return el[property];
			})
		},
		/**********************元素查找***************************/
		eq: function(idx) {
			return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1);
		},
		get: function(idx) {
			return idx === undefined ? [].slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
		},
		prev: function(selector) {
			return Dom(this.pluck('previousElementSibling')).filter(selector || '*');
		},
		next: function(selector) {
			return Dom(this.pluck('nextElementSibling')).filter(selector || '*')
		},
		first: function() {
			var el = this[0];
			return el && typeof el != 'object' ? el : Dom(el);
		},
		last: function() {
			var el = this[this.length - 1];
			return el && typeof el != 'object' ? el : Dom(el);
		},
		find: function(selector) {
			var result, $this = this;
			if (!selector) {
				return [];
			} else if (typeof selector == 'object') {
				result = Dom(selector).filter(function() {
					var node = this;
					return [].some.call($this, function(parent) {
						return Dom.contents(parent, node);
					})
				})
			} else if (this.length == 1) {
				result = Dom(Dom.query(this[0], selector));
			} else {
				result = this.map(function() {
					return Dom.query(this, selector);
				})
			}
			return result;
		},
		closest: function(selector, context) {
			var node = this[0], collection = false;
			if (typeof selector == 'object') {
				collection = Dom(selector);
			}
			while (node && !(collection ? collection.indexOf(node) >= 0 : Dom.matches(node, selector))) {
				node = node !== context && !thin.isDocument(node) && node.parentNode;
			}
			return Dom(node);
		},
		parents: function(selector) {
			var ancestors = [], nodes = this;
			while(nodes.length > 0) {
				nodes = Dom.map(nodes, function(node) {
					if ((node = node.parentNode) && !thin.isDocument(node) && ancestors.indexOf(node) < 0) {
						ancestors.push(node);
						return node;
					}
				})
			}
			return filtered(ancestors, selector);
		},
		parent: function(selector) {
			return filtered(uniq(this.pluck['parentNode']), selector);
		},
		siblings: function(selector) {
			return filtered(this.map(function(i, el) {
				return [].filter.call(children(el.parentNode), function(child) {
					return child !== el;
				})
			}), selector);
		},
		contents: function() {
			return this.map(function() {
				return [].slice.call(this.childNodes);
			})
		},
		children: function(selector) {
			return filtered(this.map(function() {
				return children(this);
			}), selector)
		},
		has: function(selector) {
			return this.filter(function() {
				return thin.isObject(selector) ? 
					Dom.contains(this, selector) : 
					Dom(this).find(selector).size();
			})
		},
		not: function(selector) {
			var nodes = [];
			// 为Function类型时，传入元素执行方法
			if (thin.isFunction(selector) && selector.call !== undefined) {
				this.each(function(idx) {
					if (!selector.call(this, idx)) nodes.push(this);
				})
			} else {
				var excludes = typeof selector == 'string' ? this.filter(selector) :
					(typeof selector.length === 'number' && thin.isFunction(selector.item)) ? [].slice.call(selector) : Dom(selector);
				this.forEach(function(el) {
					if (excludes.indexOf(el) < 0) nodes.push(el);
				})
			}
		},
		is: function(selector) {
			return this.length > 0 && Dom.matches(this[0], selector);
		},
		add: function(selector, context) {
			return Dom(uniq(this.concat(Dom(selector, context))));
		},
		/***************************html操作****************************************/
		empty: function() {
			return this.each(function() {
				this.innerHTML = '';
			})
		},
		clone: function() {
			return this.map(function() {
				return this.cloneNode(true);
			})
		},
		html: function(html) {
			return 0 in arguments ?
				this.each(function(idx) {
					var originHtml = this.innerHTML;
					Dom(this).empty().append( funcArg(this, html, idx, originHtml) );
				}) :
				(0 in this ? this[0].innerHTML : null);
		},
		text: function() {
			return 0 in arguments ? 
				this.each(function(idx) {
					var newText = funcArg(this, text, idx, this.textContent);
					this.textContent = newText == null ? '' : '' + newText;
				}) : 
				(0 in this ? this[0].textContent : null);
		},
		wrap: function() {

		},
		unwrap: '',
		wrapInner: '',
		wrapAll: '',
		replaceWidth: '',
		offset: '',
		index: function(element) {
			return element ? this.indexOf(Dom(element)[0]) : this.parent().children().indexOf(this[0]);
		},
		size: function() {
			return this.length;
		},
		/**************************属性操作************************************/
		show: '',
		hide: '',
		toggle: function(setting) {
			return this.each(function() {
				var el = Dom(this);
				(setting === undefined ? el.css('display') == 'none' : setting) ? el.show() : el.hide();
			})
		},
		attr: '',
		removeAttr: '',
		width: '',
		val: '',
		position: '',
		scrollLeft: '',
		scrollTop: '',
		offset: '',
		data: '',
		/**************************样式操作********************************************/
		css: function(property, value) {
			if (arguments.length < 2) {
				var element = this[0],
					computedStyle = getComputedStyle(element, '');
				if (!element) return;
				if (typeof property == 'string') {
					return element.style[camelize(property)] || computedStyle.getPropertyValue(property);
				} else if (thin.isArray(property)) {
					var props = {};
					Dom.each(property, function(_, prop) {
						props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop));
					})
					return props;
				}
			}
			var css = '', key;
			if (thin.isString(property)) {
				if (!value && value !== 0) {
					this.each(function() {
						this.style.removeProperty(dasherize(property));
					})
				} else {
					css = dasherize(property) + ':' + maybeAddPx(property, value);
				}
			} else {
				for (key in property) {
					if (!property[key] && property[key] !== 0) {
						this.each(function() {
							this.style.removeProperty(dasherize(key));
						})
					} else {
						css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
					}
				}
			}
			return this.each(function(){
				this.style.cssText += ';' + css;
			})
		},
		hasClass: function(name) {
			// if (!name) return false;
			// return [].some.call(this, function(el) {
			// 	return this.test(className(el))
			// }, )
		},
		addClass: '',
		removeClass: '',
		toggleClass: '',
	}

	Dom.T.prototype = Dom.fn;

	return Dom;
})