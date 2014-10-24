define('util', function(){

	var doc = document;

	return {
		/**
		 * @param {obj}
		 * @desciption 	是否空对象
		 */
		isEmptyObject: function(obj) {
			for (var o in obj) {
				if (obj.hasOwnProperty(o)) {
					return false;
				}
			}
			return true;
		},
		/**
		 * @param {str} string
		 * @desciption 	去除两边空格
		 */
		trim: function(str) {
			return str.replace(/^\s*|\s*$/, '');
		},
		/**
		 * @param {elem} 
		 * @param {selector}
		 * @description 检测dom元素是否匹配选择器selector, 兼容低版本ie6-8实现matchesSelector功能
		 */
		matchesSelector: (function() {
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
	}
});