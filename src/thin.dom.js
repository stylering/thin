(function() {

	var win = window;
	var doc = document;

	var thin = win.thin || (win.thin = {});

	var idRegExp = /^#[\w-]*$/;
	var tagNameRegExp = /^[\w]+$/;
	var classNameRegExp = /^\.[\w-]+/;
	// 检测是否支持classList属性
	isSupportClassList = 'classList' in doc.body;

	// zeptojs
	var Dom = function(dom, selector) {
		dom = dom || [];
		dom.__proto__ = Dom.fn;
		dom.selector = selector || '';
		return dom;
	}

	Dom.$ = function(selector, context) {
		return Dom.fn.init(selector, context);
	}

	Dom.query = function(selector, context) {
		var result;

		if (!thin.isString(selector)) result = [];
		selector = thin.util.trim(selector);
		context = context || doc;

		if (idRegExp.test(selector)) {
			selector = selector.replace('#', '');
			return [doc.getElementById(selector)];
		} else if (tagNameRegExp.test(selector)) {
			result = context.getElementsByTagName(selector);
		} else if (classNameRegExp.test(selector)) {
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

	Dom.fn = Dom.prototype = {
		init: function(selector, context) {
			var dom;
			if (!selector) return Dom();

			// selector为字符串时
			// id className tagName and other tags
			if (thin.isString(selector)) {
				selector = thin.util.trim(selector);
				dom = Dom.query(selector, context);
			}

			// 为thin Dom对象时

			return Dom(dom, selector);
		},

		each: '',
		eq:'',
		get: '',
		first: '',
		last: '',
		find: '',
		closest: '',
		parents: '',
		parent: '',
		siblings: '',
		empty: '',
		show: '',
		hide: '',
		clone: '',
		toggle: '',
		prev: '',
		next: '',
		html: '',
		text: '',
		attr: '',
		removeAttr: '',
		val: '',
		offset: '',
		css: '',
		index: '',
		hasClass: '',
		addClass: '',
		removeClass: '',
		toggleClass: '',
		width: ''
	}

	// var Dom = {
	// 	$: function(selector, context) {
	// 		var result;
	// 		context = context || doc;
	// 		if (idRegExp.test(selector)) {
	// 			return (result = this.id(selector.replace('#', ''))) ? [result] : [];
	// 		} else if (tagNameRegExp.test(selector)) {
	// 			result = this.tagName(selector, context);
	// 		} else if (classNameRegExp.test(selector)) {
	// 			result = this.className(selector.replace('\.', ''), context);
	// 		} else {
	// 			reuslt = context.querySelectorAll(selector);
	// 		}
	// 		// 类数组对象转换为数组对象
	// 		return Array.prototype.slice.call(result);
	// 	},
	// 	id: function(id) {
	// 		return doc.getElementById(id);
	// 	},
	// 	tagName: function(tagName, context) {
	// 		context = context || doc;
	// 		return context.getElementsByTagName(tagName);
	// 	},
	// 	className: function(className, context) {
	// 		var tags, i, len, elements = [];
	// 		context = context || doc;
	// 		if (context.getElementsByClassName) {
	// 			return context.getElementsByClassName(className);
	// 		} else {
	// 			tags = this.tagName('*', context);
	// 			for (i=0, len=tags.length; i<len; i++) {
	// 				if (tags[i].className && (' ' + tags[i].className + ' ').indexOf(' ' + className + '') >= 0) {
	// 					elements.push(tags[i]);
	// 				}
	// 			}
	// 			return elements;
	// 		}
	// 	},
	// 	// 删除元素
	// 	remove: function(node) {
	// 		var parent = node.parentNode;
	// 		if (parent) parent.removeChild(node);
	// 	},
	// 	addClass: isSupportClassList ? function(elem, className) {
	// 		if (elem && className && !this.hasClass(elem, className)) {
	// 			elem.classList.add(className);
	// 		}
	// 	} : function(elem, className) {
	// 		if (elem && className && !this.hasClass(elem, className)) {
	// 			elem.className = elem.className + ' ' + className;
	// 		}
	// 	},
	// 	removeClass: isSupportClassList ? function(elem, className) {
	// 		if (elem && className && this.hasClass(elem, className)) {
	// 			elem.classList.remove(className);
	// 		}
	// 	} : function(elem, className) {
	// 		if (elem && className && this.hasClass(elem, className)) {
	// 			elem.className = elem.className.replace(new RegExp('(?:^|\\s)' + className + '(?:\\s|$)'), ' ');
	// 		}
	// 	},
	// 	hasClass: isSupportClassList ? function(elem, className) {
	// 		if (!elem || !className) return false;
	// 		return elem.classList.contains(className);
	// 	} : function(elem, className) {
	// 		if (!elem || !className) return false;
	// 		return (' ' + elem.className + ' ').indexOf(' ' + className + ' ') > -1
	// 	},
	// 	toggleClass: function (elem, className) {
	// 		this.hasClass(elem, className) ? this.removeClass(elem, className) :this.addClass(elem, className);
	// 	},
	// 	closest: function(elem, selector) {
	// 		while (elem) {
	// 			if (this.matchesSelector(elem, selector)) {
	// 				return elem
	// 			}
	// 			elem = elem.parentNode;
	// 		}
	// 	},
	// 	prev: function(elem) {
	// 		if (elem.previousElementSibling) {
	// 			return elem.previousElementSibling;
	// 		}
	// 		while (elem = elem.previousSibling) {
	// 			if (elem.nodetype === 1) return elem.previousSibling;
	// 		}
	// 	},
	// 	next: function(elem) {
	// 		if (elem.nextElementSibling) {
	// 			return elem.nextElementSibling;
	// 		}
	// 		while (elem = elem.nextSibling) {
	// 			if (elem.nodetype === 1) return elem.nextSibling;
	// 		}
	// 	},
	// 	first: function(elem) {
	// 		if (elem.firstElementChild) {
	// 			return elem.firstElementChild;
	// 		}
	// 		while (elem = elem.firstChild) {
	// 			if (elem.nodetype === 1) return elem.firstChild;
	// 		}
	// 	},
	// 	last: function(elem) {
	// 		if (elem.lastElementChild) {
	// 			return elem.lastElementChild;
	// 		}
	// 		while (elem = elem.lastChild) {
	// 			if (elem.nodetype === 1) return elem.lastChild;
	// 		}
	// 	},
	// 	children: function(elem) {
	// 		if (elem.children) {
	// 			return thin.makeArray(elem.children);
	// 		}
	// 		return [];
	// 	},
	// 	parent: function(elem) {
	// 		if (elem.parentElement) {
	// 			return elem.parentElement;
	// 		}
	// 		while (elem = elem.parentNode) {
	// 			if (elem.nodetype === 1) return elem.parentNode;
	// 		}
	// 	},

	// 	/**
	// 	 * @param {elem} 
	// 	 * @param {selector}
	// 	 * @description 检测dom元素是否匹配选择器selector, 兼容低版本ie6-8实现matchesSelector功能
	// 	 */
	// 	matchesSelector: function(elem, selector) {
	// 		var body = doc.body;
	// 		var matchesSelector = body.webkitMatchesSelector || body.msMatchesSelector || body.mozMatchesSelector || body.oMatchesSelector;

	// 		if (matchesSelector) {
	// 			return matchesSelector.call(elem, selector);
	// 		} else {
	// 			var parent,
	// 				matches;

	// 			parent = elem.parentNode;
	// 			// 元素已存在DOM文档树中
	// 			if (parent) {
	// 				var len;
	// 				matches = parent.querySelectorAll(selector);
	// 				len = matches.length;
	// 				while(len--) {
	// 					if (matches[len] == elem) {
	// 						return true;
	// 					}
	// 				}
	// 				return false;
	// 			} else {
	// 				var div,
	// 					parentNode;
	// 				// 元素未添加到DOM文档树
	// 				div = doc.createElement('div');
	// 				parentNode = div.appendChild(elem);
	// 				matches = parentNode.querySelector(selector);
	// 				div = null;
	// 				if (matches.length) {
	// 					return true;
	// 				}
	// 				return false;
	// 			}
	// 		}
	// 	}
	// }

	thin.dom = thin.$ = Dom.$;

}())