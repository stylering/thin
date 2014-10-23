define('dom', function() {

	var doc = document;

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

	thin.$ = thin.dom = Dom.$;
})