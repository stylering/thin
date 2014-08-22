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
	var _guid = 1;

	thin.cache || (thin.cache = {});
	var cache = thin.cache.__event_cache = {};

	var guid = function(element) {
		return element._guid || (element._guid = _guid++);
	}
	var returnTrue = function() {
		return true;
	};
	var returnFalse = function() {
		return false;
	};
	var isFocusinSupported = 'onfocusin' in window;
	var mouseEvent = 'click mouseup mousemove mousedown';
	var specialEvent = {
		focus: { focus: 'focusin', blur: 'focusout' },
		hover: { mouseenter: 'mouseover', mouseleave: 'mouseout' }
	};
	var realEvent = function(type) {
		return specialEvent.hover[type] || (isFocusinSupported && specialEvent.focus[type]) || type;
	};
	var compatible = function(event) {
		var source,
			methods;

		// 原始事件
		source = event;
		methods = {
			preventDefault: 'isDefaultPrevented', 
			stopPropagation: 'isImmediatePropagationStopped', 
			stopImmediatePropagation: 'isPropagationStopped'	
		}
		// 增加属性，用于标记事件是否冒泡、是否被禁止默认事件，主要用于事件代理
		thin.forEach(methods, function(method, key) {
			var sourceMethod = source[key];
			event[key] = function() {
				this[method] = returnTrue;
				return sourceMethod && sourceMethod.apply(source, arguments);
			}
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
	var proxyEvent = function(event) {
		var proxy, key;
		proxy = { originalEvent: event };
		for (key in event) {
			if (event[key] !== undefined) proxy[key] = event[key];
		}
		return proxy;
	};

	// zepto.js $.contains
	var contains = doc.documentElement.contains ?
	    function(parent, node) {
	      return parent !== node && parent.contains(node)
	    } :
	    function(parent, node) {
	      while (node && (node = node.parentNode))
	        if (node === parent) return true
	      return false
	    }
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
		add: function(element, type, callback, selector) {
			var id, handles, i,
				handle = {},
				delegator, fn, result, 
				target;
			
			thin.forEach(type.split(/\s/), function(t){
				id = guid(element);
				handles = cache[id] || (cache[id] = []);
				if (selector) {
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

				handle = {
					type: t,
					elem: element,
					selector: selector,
					callback: callback,
					delegator: delegator,
					index: handles.length,
				};
				if (t in specialEvent.hover) {
					callback = function(e) {
						var related = e.relatedTarget
						if (!related || (related !== element && !contains(element, related)))
						  return handle.callback.apply(element, arguments);
					}
				}
				fn = delegator || callback;
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
			Event.remove(type, element, callback);
		},
		// selector|element
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
			if (element instanceof HTMLElement) {
				element = [element];
			}
			
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
			if (element instanceof HTMLElement) {
				element = [element];
			}
			thin.forEach(element, function(elem) {
				Event.remove(elem, type, callback, selector);
			});
		},
		trigger: function(type, element) {
			
		}
	};

	thin.event = Event;
}());