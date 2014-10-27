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

	var methodAttrs = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'];

	// 参照zeptojs
	function Dom(dom, selector) {
		dom = dom || [];
		dom.__proto__ = Dom.fn;
		dom.selector = selector || '';
		return dom;
	}

	Dom.$ = function(selector, context) {
		return Dom.init(selector, context);
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
			dom = $(document.createFragment(RegExp.$1))
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
			nodes = Dom.$(dom);
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
			return $(document).ready(selector);
		} else if (Dom.isDom(selector)) {		// 已经是Dom类型实例
			return selector;
		} else if (thin.isObject(selector)) {	// 为节点对象类型
			dom = [selector];
			selector = null;
		} else if (thin.isArray(selector)) {	// 数组类型时
			dom = [].filter.call(selector, function(i){
				return i != null
			});
		}

		// 为thin Dom对象时
		return Dom(dom, selector);
	}

	Dom.isDom = function(obj) {
		return obj instanceof Dom;
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

	Dom.fn = Dom.prototype = {
		/*********************元素遍历*************************************/
		each: function(callback) {
			[].every.call(this, function(el, idx) {
				return callback.call(el, idx, el) !== false;
			})
			return this;
		},
		map: function(fn) {
			return $(Dom.map(this, function(el, idx) {
				return fn.call(el, idx, el);
			}))
		},
		filter: '',
		toArray: '',
		ready: '',
		slice: '',
		forEach: '',
		reduce: '',
		push: '',
		sort: '',
		indexOf: '',
		concat: '',
		/**********************元素查找***************************/
		eq: function(idx) {
			return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1);
		},
		get: function(idx) {
			return idx === undefined ? Array.prototype.slice.call(this) : this[idx >= 0 ? idx : idx + this.length];
		},
		prev: function() {

		},
		next: '',
		first: '',
		last: '',
		find: function(){},
		closest: '',
		parents: '',
		parent: '',
		siblings: '',
		contents: '',
		children: '',
		has: '',
		not: '',
		is: '',
		add: '',
		/***************************html操作****************************************/
		empty: '',
		clone: '',
		toggle: '',
		html: '',
		offset: '',
		index: '',
		text: '',
		wrap: '',
		unwrap: '',
		wrapInner: '',
		wrapAll: '',
		replaceWidth: '',
		size: function() {
			return this.length;
		},
		/**************************属性操作************************************/
		show: '',
		hide: '',
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
		css: '',
		hasClass: '',
		addClass: '',
		removeClass: '',
		toggleClass: '',
	}

	return Dom;
})