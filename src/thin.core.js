/**
 * 
 *
 * @author: leo
 */

(function(root, doc, T, undefined) {

	var thin = root[T] || { version: '1.0.0' };

	if (typeof exports !== 'undefined') {
		if (typeof module !== 'undefined' && module.exports) {
			exports = module.exports = thin;
		}
		exports.thin = thin
	} else {
		root[T] = thin;
	}

	/**
	 * @description 类型判断
	 * isString 
	 * isBoolean 
	 * isFunction 
	 * isArray 
	 * isObject 
	 * isNumber
	 */

	// 类型判断函数
	_forEach(
		['String', 'Boolean', 'Function', 'Array', 'Object', 'Number', 'RegExp'],
		function(v) {
			thin['is' + v] = function(o) {
				return Object.prototype.toString.call(o).slice(8, -1) === v;
			}
		}
	);

	/**
	 * @description 外部方法
	 * 
	 * forEach 		数据与对象循环
	 * extend	 	对象扩展
	 * makeArray 	类数据转换为数据
	 * domReady 	DOM树加载函数
	 */
	_extend(thin, {

		forEach: _forEach,

		extend: _extend,

		makeArray: _makeArray,

		domReady: _domReady

	});

	// forEach循环
	function _forEach(obj, iterator, context) {
	  	var key;
	  	if (obj) {
		    if (obj.forEach && obj.forEach !== _forEach) {
		      	obj.forEach(iterator, context);
		    } else {
		      	for (key in obj) {
			        if (obj.hasOwnProperty(key)) {
			          iterator.call(context, obj[key], key);
			        }
		      	}
	    	}
		}
	  	return obj;
	}

	// 对象扩展
	function _extend(target, source) {
		var args = [].slice.call(arguments), i = 1, key,
			ride = typeof args[args.length - 1] == 'Boolean' ? args.pop() : true;

		if (args.length === 1) {
			target = !this.window ? this : {};
			i = 0;
		}

		while (source = args[i++]) {
			for (key in source) {
				if (ride || !(key in target)) {
					target[key] = source[key];
				}
			}
		}
	}

	// 类数组对象转化为数组对象
	function _makeArray(a, i, j) {
		return Array.prototype.slice.call(a, i || 0, j || j.length);
	}

	function _domReady(fn) {
		var isReady = false,
			arrayFun = [],
			fireReady;

		if (thin.isFunction(fn)) {
			arrayFun.push(fn);
		}

		fireReady = function() {
			if (isReady) return;
			isReady = true;
			while (arrayFun.length) {
				arrayFun.shift()();
			}
		};

		if (doc.addEventListener) {
			doc.addEventListener('DOMContentLoaded', function() {
				doc.removeEventListener('DOMContentLoaded', arguments.callee, false);
				fireReady();
			}, false)
		} else {
			document.write('<script id="ie-domReady" defer src="\/\/:"></script>');
			doc.getElementById('ie-domReady').onreadystatechange = function() {
				if (this.readyState === 'complete') {
					this.onreadystatechange = null;
					fireReady();
					this.parentNode.removeChild(this);
				}
			}
		}
	}

})(this, document, 'thin');