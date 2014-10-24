define('dom', function() {

	var doc = document;

	var rId = /^#[\w-]*$/;			// id
	var rTagName = /^[\w]+$/;		// html标签
	var rClassName = /^\.[\w-]+/;	// css class 类名
	var rTrim = /^\s*|\s*$/;		// 去除空格

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
		init: function(selector, context) {
			var dom;
			if (!selector) return Dom();

			// selector为字符串时
			// id className tagName and other tags
			if (thin.isString(selector)) {
				selector = selector.replace(rTrim, '');
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

	return Dom.$;
})