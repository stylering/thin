/**
 * @description:
 * 	
 *  
 * @version: 1.0.0
 * @author: stylering
 */
(function(){

	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});
	// 标识绑定元素与回调函数的唯一性
	var _guid = 1;
	/*缓存绑定的元素、事件、回调、代理函数
	thin.cache.__event_cache = {
		1: [{
			type: type,				// 绑定的事件类型
			elem: element,			// 绑定的元素
			selector: selector,		// 事件代理元素
			callback: callback,		// 回调函数
			delegator: delegator,	// 事件代理时的回调函数
			index: handles.length,	// 标志位，用于解除监听时删除使用
			proxy: function(){}		// 每个元素的事件监听函数
		},{}]
	}*/
	thin.cache || (thin.cache = {});
	var cache = thin.cache.__event_cache = {};
	// 获取和设置元素或回调函数的唯一标识id
	var guid = function(element) {
		return element._guid || (element._guid = _guid++);
	}
	var returnTrue = function() {
		return true;
	};
	var returnFalse = function() {
		return false;
	};
	// 是否支持onfocusin和onfocusout事件
	var isFocusinSupported = 'onfocusin' in window;
	// 鼠标事件类型，用于触发createEvent时使用
	var mouseEvents = {};
	thin.forEach(['click', 'mouseup', 'mousemove', 'mousedown'], function(e) {
		mouseEvents[e] = 'MouseEvents';
	});
	// 标识特殊事件
	var specialEvent = {
		focus: { focus: 'focusin', blur: 'focusout' },
		hover: { mouseenter: 'mouseover', mouseleave: 'mouseout' }
	};
	// 获取绑定事件
	// 当浏览器支持focusin时，focus用focusin代替绑定
	// 当事件为mouseenter、mouseleave时用真实事件mouseover绑定
	var realEvent = function(type) {
		return specialEvent.hover[type] || (isFocusinSupported && specialEvent.focus[type]) || type;
	};
	/* 对事件对象进行处理，增加三个属性，用于标识事件的状态
	 * isDefaultPrevented 判断是否禁用默认事件
	 * isImmediatePropagationStopped 判断是否禁用事件冒泡和此元素同类型事件的冒泡
	 * isPropagationStopped 判断是否禁用事件冒泡
	 */
	var compatible = function(event) {
		if ('isDefaultPrevented' in event) return event;
		var source,
			methods;

		// 原始事件
		source = event;
		methods = {
			preventDefault: 'isDefaultPrevented', 
			stopPropagation: 'isPropagationStopped',
			stopImmediatePropagation: 'isImmediatePropagationStopped'
		}
		// 增加属性，用于标记事件是否冒泡、是否被禁止默认事件，主要用于事件代理
		thin.forEach(methods, function(method, key) {
			var sourceMethod = source[key];
			event[key] = function() {
				this[method] = returnTrue;
				return sourceMethod && sourceMethod.apply(source, arguments);
			}
			// 默认方法
			event[method] = returnFalse;
		});
		// zepto.js
		if (source.defaultPrevented !== undefined ? source.defaultPrevented :
          'returnValue' in source ? source.returnValue === false :
          source.getPreventDefault && source.getPreventDefault()) {
        	event['isDefaultPrevented'] = returnTrue
		}
		return event;
	};
	// 复制原始事件属性，返回新创建的事件对象
	var proxyEvent = function(event) {
		var proxy, key;
		proxy = { originalEvent: event };
		for (key in event) {
			if (event[key] !== undefined) proxy[key] = event[key];
		}
		return proxy;
	};

	/* zepto.js $.contains
	 * 判断node元素是为parent元素的子元素
	 */
	var contains = doc.documentElement.contains ?
	    function(parent, node) {
	      return parent !== node && parent.contains(node)
	    } :
	    function(parent, node) {
	      while (node && (node = node.parentNode))
	        if (node === parent) return true
	      return false
	    }
	/* 查找缓存在cache中事件对象
	 * 返回满足条件的事件对象
	 */
	var findHandles = function(type, element, callback, selector) {
		var id, 
			result = [],
			i,
			handles, handle;

		handles = cache[guid(element)];
		i = handles.length;
		while (i--) {
			handle = handles[i];
			if ((!type || type == handle.type)
				&& (!element || element == handle.elem)
				&& (!callback || guid(callback) === guid(handle.callback))
				&& (!selector || selector == handle.selector)) {
				result.push(handle);
			}
		}
		return result;
	}
	var Event = {
		/** 绑定事件，增加绑定事件对象至cache中
		 * @element 事件对象
		 * @type 事件类型
		 * @callback 事件回调参数
		 * @selector 事件代理元素
		*/
		add: function(element, type, callback, selector) {
			var id, handles, i,
				handle = {},
				delegator, fn, result, 
				target;
			
			thin.forEach(type.split(/\s/), function(t){
				id = guid(element);
				// 获取存储在cache中的事件对象
				handles = cache[id] || (cache[id] = []);
				if (selector) {
					// 判断selector存在时，事件代理函数为delegator
					delegator = function(e) {
						var evt;
						target = e.target;
						while(target != element) {
							if (thin.util.matchesSelector(target, selector)) {
								evt = proxyEvent(e);
								evt.currentTarget = target;
								return callback.apply(target, [evt]);
							}
							if (target.parentNode) {
								target = target.parentNode;
							}
						}
					}
				}
				// 创建事件缓存对象
				handle = {
					type: t,
					elem: element,
					selector: selector,
					callback: callback,
					delegator: delegator,
					index: handles.length,
				};
				// 模拟事件类型mouseenter和mouseleave事件
				if (t in specialEvent.hover) {
					callback = function(e) {
						// 获取mouseout和mouseover的relatedTarget对象
						var related = e.relatedTarget;
						if (!related || (related !== element && !contains(element, related)))
						  return handle.callback.apply(element, arguments);
					}
				}
				fn = delegator || callback;
				// 事件监听函数
				handle.proxy = function(e) {
					e = compatible(e);
					if (e.isImmediatePropagationStopped()) return;
					result = fn.apply(element, [e]);
					if (result === false) {
						e.stopPropagation();
						e.preventDefault();
					}
					return result;
				};
				handles.push(handle);
				if ('addEventListener' in element) {
					element.addEventListener(realEvent(t), handle.proxy, false);
				}
			});
		},
		remove: function(element, type, callback, selector) {
			var id = guid(element);
			thin.forEach(type.split(/\s/), function(t) {
				var i, handles;
				handles = findHandles(t, element, callback, selector);
				i = handles.length;
				while(i--) {
					delete cache[id][handles[i].index];
					if ('removeEventListener' in element) {
						element.removeEventListener(t, handles[i].proxy, false);
					}
				}
			});
		},
		bind: function(type, element, callback) {
			Event.on(type, element, callback);
		},
		unbind: function(type, element, callback) {
			Event.off(type, element, callback);
		},
		/*
		 * @type 事件类型
		 * @element 绑定的元素
		 * @selector 事件代理元素
		 * @callback 事件回调
		 */
		on: function(type, element, selector, callback) {

			if (type && !thin.isString(type)) {
				thin.forEach(type, function(fn, t) {
					Event.on(t, element, selector, callback);
				})
				return;
			}
			if (thin.isFunction(selector)) {
				callback = selector;
				selector = undefined;
			}
			if (doc || element instanceof HTMLElement) {
				element = [element];
			}
			// 设置回调函数的唯一标识
			guid(callback);
			thin.forEach(element, function(elem) {
				Event.add(elem, type, callback, selector);
			});
		},
		off: function(type, element, selector, callback) {
			if (type && !thin.isString(type)) {
				thin.forEach(type, function(fn, t) {
					Event.on(t, element, selector, callback);
				})
				return;
			}
			if (thin.isFunction(selector)) {
				callback = selector;
				selector = undefined;
			}
			if (doc || element instanceof HTMLElement) {
				element = [element];
			}
			thin.forEach(element, function(elem) {
				Event.remove(elem, type, callback, selector);
			});
		},
		trigger: function(type, element) {
			if (doc || element instanceof HTMLElement) {
				element = [element];
			}
			if (!thin.isString(type)) return;
			thin.forEach(element, function(elem) {
				thin.forEach(type.split(/\s/), function(t) {
					var evt, 
						handles,
						i;

					if (/^(focus|blur)$/.test(t)) {
						try { elem[t]() } 
						catch (e) {}
						return;
					}
					// 创建自定义事件
					evt = doc.createEvent(mouseEvents[t] || 'Events');
					// 初始化事件
					evt.initEvent(t, true, true);
					// 增加事件属性，用于标识冒泡状态和是否禁用默认事件状态
					evt = compatible(evt);
					// 创建新的事件对象
					evt = proxyEvent(evt);
					// 修改事件的触发元素
					evt.target = elem;
					// 查找缓存的事件对象
					handles = findHandles(t, elem);
					i = handles.length;
					while (i--) {
						// 遍历循环执行回调
						handles[i].proxy(evt);
						if (evt.isImmediatePropagationStopped()) return false
					}
				});
			});
		}
	};

	// 绑定单个事件函数
	thin.forEach(['focusin', 'focusout', 'focus', 'blur', 'load', 'resize', 'scroll', 'unload', 'click', 'dblclick',
	'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
	'change', 'select', 'keydown', 'keypress', 'keyup', 'error'], function(event) {
	  	Event[event] = function(elem, callback) {
	    	return callback ?
	    		Event.bind(event, elem, callback) :
	    		Event.trigger(event, elem);
	  	};
	});

	thin.event = Event;
}());