(function(){
	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	var direction = function(x1, x2, y1, y2) {
		return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ?
			((x1 - x2 > 0) ? 'Left' : 'Right') : ((y1 - y2 > 0) ? 'Top' : 'Bottom');
	};
	// 清除所有正在执行的触屏事件
	var cancelAll = function() {
		if (tapTimeout) clearTimeout(tapTimeout);
		if (singleTapTimeout) clearTimeout(singleTapTimeout);
		if (doubleTaptimeout) clearTimeout(doubleTaptimeout);
		if (longTapTimeout) clearTimeout(longTapTimeout);
		if (swipeTimeout) clearTimeout(swipeTimeout);
		tapTimeout = singleTapTimeout = doubleTaptimeout = longTapTimeout = swipeTimeout = null;
	};
	// 全局事件对象
	var touch = {};
	var firstTouch;
	var distanceX=0,  distanceY = 0;
	var tapTimeout, singleTapTimeout, doubleTaptimeout, longTapTimeout, swipeTimeout;
	var space;

	// webkit内核浏览器事件类型为touchstart
	// IE9事件类型为MSPointerDown
	// IE10+事件类型为pointerdown
	thin.event.on('touchstart MSPointerDown pointerdown', doc, function(e) {
		var	distance,
			now,
			space;

		firstTouch = e.touches[0];
		if (touch.x2) {
			touch.x2 = undefined;
			touch.y2 = undefined;
		}
		touch.x1 = firstTouch.pageX;
		touch.y1 = firstTouch.pageY;
		touch.el = 'tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode;
		now = Date.now();
		// 两次触摸的时间间隔
		space = now - touch.last || now;
		// 如果两次触摸的时间间隔大于0和小于250ms时，作为双触摸事件
		if (space > 0 && space <= 250) touch.isDoubleTap = true;
		touch.last = now;
	});

	thin.event.on('touchmove MSPointerMove pointermove', doc, function(e) {
		firstTouch = e.touches[0];
		touch.x2 = firstTouch.pageX;
		touch.y2 = firstTouch.pageY;
		distanceX = Math.abs(touch.x1 - touch.x2);
		distanceY = Math.abs(touch.y1 - touch.y2);
	});

	thin.event.on('touchend MSPointerUp pointerup', doc, function(e) {
		// 第二点的距离大于30的时候，触发swipe事件
		if ((touch.x2 && distanceX > 30) || (touch.y2 && distanceY > 30)) {
			swipeTimeout = setTimeout(function(){
				// 触发swipe自定义事件
				thin.event.trigger('swipe', touch.el);
				// 触发swipeLeft等swipe自定义事件
				thin.event.trigger('swipe' + direction(touch.x1, touch.x2, touch.y1, touch.y2), touch.el);
				touch = {};
			}, 0);
		// 否则为tap事件
		} else {
			// 距离小于30的时是tap事件
			if (distanceX < 30 && distanceY < 30) {
				tapTimeout = setTimeout(function() {
					// 单次触摸，并且在事件中增加cancelTouch方法
					thin.event.trigger('tap', touch.el, {cancelTouch: cancelAll});
					// 两次触摸
					if (touch.isDoubleTap) {
						thin.event.trigger('doubleTap', touch.el);
						touch = {};
					} else {
						// 单触摸事件
						singleTapTimeout = setTimeout(function(){
							singleTapTimeout = null;
							thin.event.trigger('singleTap', touch.el);
							touch = {};
						}, 250);
					}
				}, 0)
			} else {
				touch = {};
			}
			distanceX = distanceY = 0;
		}
	});

	thin.event.on('touchcancel MSPointerCancel pointercancel', doc, cancelAll);

	// 增加touch事件API
	thin.forEach(['tap', 'singleTap', 'longTap', 'doubleTap', 'swipe', 
		'swipeLeft', 'swipeRight', 'swipeTop', 'swipeBottom'], function(eventName) {
		thin.event[eventName] = function(elem, callback) {
			thin.event.on(eventName, elem, callback);
		}
	})

}());