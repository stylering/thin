(function() {

	var win = window;
	var doc = document;

	var thin = win.thin || (win.thin = {});

	var idRegExp = /^#[\w-]*$/;
	var tagNameRegExp = /^[\w]+$/;
	var classNameRegExp = /^\.[\w-]+/;

	var Dom = {
		$: function(selector, context) {

		},
		id: function(id) {
			return doc.getElementById(id);
		},
		tagName: function(tagName, context) {
			context = context || doc;
			return context.getElementsByTagName(tagName);
		},
		className: function(className, context) {
			var tags, i, len, elements = [];
			context = context || doc;
			if (context.getElementsByClassName) {
				return context.getElementsByClassName(className);
			} else {
				tags = this.tagName('*', context);
				for (i=0, len=tags.length; i<len; i++) {
					if (tags[i].className && (' ' + tags[i].className + ' ').indexOf(' ' + className + '') != -1) {
						elements.push(tags[i]);
					}
				}
				return elements;
			}
		},
		remove: function(node) {

		},
		closest: function() {

		},
		addClass: function() {},
		removeClass: function() {},
		hasClass: function() {},
		/**
		 * @param {elem} 
		 * @param {selector}
		 * @description 检测dom元素是否匹配选择器selector, 兼容低版本ie6-8实现matchesSelector功能
		 */
		matchesSelector: function(elem, selector) {
			var body = doc.body;
			var matchesSelector = body.webkitMatchesSelector || body.msMatchesSelector || body.mozMatchesSelector || body.oMatchesSelector;

			if (matchesSelector) {
				return matchesSelector.call(elem, selector);
			} else {
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
		}
	}

	thin.dom = Dom;

}())