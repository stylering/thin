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
	var GUID = 0;
	var FGUID = 0;

	var returnTrue = function() {
		return true;
	};
	var returnFalse = function() {
		return false;
	};
	/* 事件缓存
	cache.__event_cache = {
		1 : {
			events: {
				click: [
					{
						elem: 'body',
						fguid: 1,
						handle: function(e){},
						selector: 'selector',
						origType: 'origType'
						type: 'click'
					},
				]
				.delegateCount: 1
			},
			listener: function(){}
		}	
	}
	*/
	thin.cache || (thin.cache = {});
	var cache = thin.cache.__event_cache = {};

	var Event = {
		_bind: function(elem, type, handle, selector) {
			var guid,
				handles,
				handleObj,
				special;

			if (!elem || !type || !handle) return;
			type = thin.util.trim(type).toLowerCase().replace(/\s+/g, ' ');
			if (type.indexOf(' ') > 0) {
				var typeArr = type.split(' ');
				var i, len;
				// 绑定多个事件
				for (i=0, len=typeArr.length; i<len; i++) {
					this._bind(elem, typeArr[i], handle, selector);
				}
				return;
			}

			guid = elem.guid || (elem.guid = ++GUID);
			cache[guid] = cache[guid] || {
				listener: function(event){
					// 事件兼容性处理
					event = Event.compitable(event || win.event);
					Event._dispatch.apply(elem, [event]);
				},
				events: {}
			};
			origType = type;
			special = Event.special[type] || {};	// mouseenter mouseleave
			type = (selector ? special.delegateType : special.bindType) || type;
			handles = cache[guid].events[type];
			// 相同的type只绑定一次
			if (!handles) {
				handles = cache[guid].events[type] = [];
				this.add(elem, type, cache[guid].listener, false);
			}
			if (!handles.length) {
				handles.delegateCount = 0;
			}
			if (!handle.fguid) {
				handle.fguid = ++FGUID;
			}
			// 事件对象
			handleObj = {
				elem: elem,
				fguid: handle.fguid,
				selector: selector,
				origType: origType,
				type: type,
				handle: handle
			};

			if (selector) {
				handles.splice(handles.delegateCount++, 0, handleObj);
			} else {
				handles.push(handleObj);
			}
		},
		/**
		 * 事件绑定
		 * @param 	{elem} 		元素
		 * @param 	{type} 		事件名称
		 * @param 	{handle} 	事件回调函数
		 * @selecor {handle} 	
		 * 
		 * @description 
		 * 支持多个事件同时绑定，事件之间用空格隔开，比如“click mouseup”
		 */
		_unbind: function(elem, type, handle, selector) {
			var guid,
				events,
				handleObj,
				handles, special,
				j, l, k, fguid;

			if (!elem || (elem.guid == undefined)) return;
			guid = elem.guid;
			events = cache[guid].events || {};
			// e.g.: "click mouseup mousedown"
			if (type) {
				type = thin.util.trim(type).toLowerCase().replace(/\s+/g, ' ');
				if (type.indexOf(' ') > 0) {
					var i, len, typeArr;
					for (i=0, len=typeArr.length; i<len; i++) {
						Event.unbind(elem, typeArr[i], handle, selector);
					}
					return;
				}
			} else {
				// off(elem)
				// unbind(elem)
				for (k in events) {
					Event.unbind(elem, k, handle, selector);
				}
				return;
			}
			special = Event.special[type] || {};	// mouseenter mouseleave
			type = (selector ? special.delegateType : special.bindType) || type;
			handles = events[type] || [];
			j = handles.length;
			while (j--) {
				handleObj = handles[j];
				if ((!selector || selector === handleObj.selector) &&
					(selector ||  elem === handleObj.elem) &&
					(!handle || handle.fguid === handleObj.fguid)) {
					handles.splice(j, 1);
					if (selector) {
						handles.delegateCount--;
					}
				}
			}
			if (!handles.length) {
				Event.remove(elem, type, cache[guid].listener);
				delete events[type];

				if (thin.util.isEmptyObject(events)) {
					delete cache[guid];
				}
			}
		},
		/**
		 * 事件处理程序，参考jquery
		 */
		_dispatch: function(event) {
			var elem,
				type, i, j, k,
				handles, handleObj, handle,
				delegateCount, 
				queue = [],
				matches, selector, matched,
				target, ret;
			// 事件兼容性处理
			// event = Event.compitable(event || win.event);
			type = event.type;
			target = event.target;
			handles = cache[this.guid]['events'][type];
			delegateCount = handles.delegateCount;
			// 事件代理处理
			if (delegateCount && target.nodeType) {
				while (target != this) {
					matches = [];
					for (i=0; i<delegateCount; i++) {
						selector = handles[i].selector;
						if (matches[selector] === undefined) {
							if (thin.util.matchesSelector(target, selector)) {
								matches.push(handles[i]);
							}
						}
					}
					if (matches.length) {
						queue.push({elem: target, handles: matches});
					}
					if (target.parentNode) {
						target = target.parentNode;
					} else {
						break;
					}
				}
			}
			// 非事件代理，本身绑定的事件
			if (delegateCount < handles.length) {
				queue.push({elem: this, handles: handles.slice(delegateCount)});
			}
			// 遍历事件处理队列
			j = 0;
			while ((matched = queue[j++]) && !event.isPropagationStopped()) {
				event.currentTarget = matched.elem;
				k = 0;
				while ( (handleObj = matched.handles[k++]) && !event.isImmediatePropagationStopped()) {
					event.handleObj = handleObj;
					ret = ((Event.special[handleObj.origType] || {}).handle || 
						handleObj.handle).apply(matched.elem, [event]);
					if (ret !== undefined) {
						if ((event.result = ret) === false) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		},
		/**
		 * 事件绑定
		 * @param {elem} 	元素
		 * @param {type} 	事件名称
		 * @param {handle} 	事件回调函数
		 */
		bind: function(elem, type, handle) {
			if (typeof elem === 'string') {
				var elems, i, len;
				var elems = doc.querySelectorAll(elem);
				for (i=0;  i<elems.length; i++) {
					this._bind(elems[i], type, handle);
				}
				return;
			}
			this._bind(elem, type, handle);
		},
		/**
		 * 事件解绑
		 * @param {elem} 	元素
		 * @param {type} 	事件名称
		 * @param {handle} 	事件回调函数
		 */
		unbind: function(elem, type, handle) {
			if (typeof elem === 'string') {
				var elems, i, len;
				var elems = doc.querySelectorAll(elem);
				for (i=0;  i<elems.length; i++) {
					this._unbind(elems[i], type, handle);
				}
				return;
			}
			this._unbind(elem, type, handle);
		},
		/**
		 * 事件代理绑定
		 */
		on: function(elem, type, handle) {
			var selector = elem;
			elem = doc.body;
			this._bind(elem, type, handle, selector);
		},
		/**
		 * 事件代理解绑
		 */
		off: function(elem, type, handle) {
			var selector = elem;
			elem = doc.body;
			this._unbind(elem, type, handle, selector);
		},
		// 事件触发
		trigger: function(elem, type) {
			var event, 
				special, 
				elemArr;

			special = Event.special[type] || {};	// mouseenter mouseleave
			type = special.delegateType || type;
			elemArr = Array.prototype.slice.call(doc.querySelectorAll(elem));
			try {
				event = doc.createEvent('Events');
				event.initEvent(type, true, true);
				thin.forEach(elemArr, function(el) {
					el.dispatchEvent(event);
				});
			} catch(e) {
				event = doc.createEventObject();
				thin.forEach(elemArr, function(el) {
					el.fireEvent(type, event);
				});
			}
		},
		// 原生事件
		add: function(elem, type, handle) {
			try {
				elem.addEventListener(type, handle, false);
			} catch(e) {
				elem.attachEvent('on' + type, handle);
			}
		},
		// 原生事件
		remove: function(elem, type, handle){
			try {
				elem.removeEventListener(type, handle);
			} catch(e) {
				elem.detachEvent('on' + type, handle);
			}
		},
		/**
		 * @description 事件对象的修正
		 * @param {event} 	原生事件
		 */
		compitable: function(event) {

			var eventMethod, methods, method,
				source, proxyEvent,
				key, k;

			proxyEvent = doc.addEventListener ? {originalEvent: event} : Event.fix(event);
			source = proxyEvent.originalEvent;	// 原始事件
			// 复制原始事件属性
			for (k in source) {
				if (k!== 'returnValue' && source[k] != undefined) {
					proxyEvent[k] = source[k];
				}
			}
			// 修复FF的问题
			proxyEvent.timeStamp = source.timeStamp || new Date().getTime();
			// 增加属性，用于标记事件是否冒泡、是否被禁止默认事件，主要用于事件代理
			proxyEvent.preventDefault = function() {
				this['isDefaultPrevented'] = returnTrue;
				source.preventDefault();
			};
			proxyEvent.stopPropagation = function() {
				this['isPropagationStopped'] = returnTrue;
				source.stopPropagation();
			};
			proxyEvent.stopImmediatePropagation = function() {
				this['isImmediatePropagationStopped'] = returnTrue;
				source.stopImmediatePropagation();
			};
			proxyEvent['isDefaultPrevented'] = returnFalse,
			proxyEvent['isImmediatePropagationStopped'] = returnFalse,
			proxyEvent['isPropagationStopped'] = returnFalse;
			return proxyEvent;
		},
		/**
		 * @description 特殊事件的处理
		 */
		special: {},
		// ie6-8兼容性处理
		fix: function(event) {
			var evt = {},
				html, body;

			html = doc.documentElement;
			body = doc.body;
	        evt.originalEvent = event;
			evt.target = event.srcElement;
			event.target.nodeType === 3 ? evt.target = event.target.parentNode : '';
			evt.preventDefault = function() {
				event.returnValue = false;
			};
			evt.stopPropagation = function() {
				event.cancelBuble = true;
			};
			evt.pageX = event.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html && html.clientLeft || body && body.clientLeft || 0);
	        evt.pageY = event.clientY + (html && html.scrollTop  || body && body.scrollTop  || 0) - (html && html.clientTop  || body && body.clientTop  || 0);
	        // mouseover 与 mouseout事件处理
	        evt.relatedTarget = event.fromElement === evt.target ? event.toElement : event.fromElement;

	        return evt;
		}
	}

	/**
	 * @description 
	 * mouseover  mouseout 的兼容性处理
	 */
	thin.forEach({
		mouseenter: 'mouseover',
		mouseleave: 'mouseout'
	}, function(fix, orig) {
		Event.special[orig] = {
			delegateType: fix,
			bindType: fix,
			handle: function(event) {
				var ret,
					target = this,
					related = event.relatedTarget,
					handleObj = event.handleObj;
				// jquery中还有这个判断 !jQuery.contains( target, related )
				if (!related || (related !== target)) {
					event.type = handleObj.origType;
					ret = handleObj.handle.apply(this, arguments);
					event.type = fix;
				}
			}
		}
	});
	// 绑定单个事件函数
	thin.forEach(['focusin', 'focusout', 'focus', 'blur', 'load', 'resize', 'scroll', 'unload', 'click', 'dblclick',
	'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave',
	'change', 'select', 'keydown', 'keypress', 'keyup', 'error'], function(event) {
	  	Event[event] = function(elem, callback) {
	    	return callback ?
	    		Event.bind(elem, event, callback) :
	    		Event.trigger(elem, event);
	  	};
	});

	thin.event = Event;
}());