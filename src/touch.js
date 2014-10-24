define('touch', ['event'], function(event) {

	var doc = document;

	// 全局事件对象
	var touch = {};
	var touchEvent;
	// 滑动距离
	var distanceX=0,  distanceY = 0;
	var tapTimeout, singleTapTimeout, doubleTaptimeout, longTapTimeout, swipeTimeout;
	// 两次触摸的时间间隔
	var timeSpace;
	// 滑动方向
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
	// 长按事件
	var longTap = function() {
		if (touch.last) {
			event.trigger('longTap', touch.el);
			touch = {};
		}
		longTapTimeout = null;
	}
	// 清除长按事件
	var cancelLongTap = function() {
		if (longTapTimeout) clearTimeout(longTap);
		longTapTimeout = null;
	}

	// 计算两点之间的距离
	var getDistance = function(x1, x2, y1, y2) {
		return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1-y2));
	}
	// 计算两点之间的角度
	var getAngle = function (x1, x2, y1, y2) {
		return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
	}
	// webkit内核浏览器事件类型为touchstart
	// IE9事件类型为MSPointerDown
	// IE10+事件类型为pointerdown
	event.on('touchstart MSPointerDown pointerdown', doc, function(e) {
		var	distance,
			now,
			timeSpace;

		touchEvent = e.touches[0];
		if (touch.x2) {
			touch.x2 = undefined;
			touch.y2 = undefined;
		}
		touch.x1 = touchEvent.pageX;
		touch.y1 = touchEvent.pageY;
		touch.el = 'tagName' in touchEvent.target ? touchEvent.target : touchEvent.target.parentNode;
		now = Date.now();
		// 两次触摸的时间间隔
		timeSpace = now - touch.last || now;
		// 如果两次触摸的时间间隔大于0和小于250ms时，作为双触摸事件
		if (timeSpace > 0 && timeSpace <= 250) touch.isDoubleTap = true;
		touch.last = now;
		// 长按750毫秒执行长按事件
		longTapTimeout = setTimeout(longTap, 750);
	});

	event.on('touchmove MSPointerMove pointermove', doc, function(e) {
		// 触摸已经移动了清除longTap事件
		cancelLongTap();
		touchEvent = e.touches[0];
		touch.x2 = touchEvent.pageX;
		touch.y2 = touchEvent.pageY;
		// 移动的水平距离
		distanceX = Math.abs(touch.x1 - touch.x2);
		// 移动的垂直距离
		distanceY = Math.abs(touch.y1 - touch.y2);
	});

	event.on('touchend MSPointerUp pointerup', doc, function(e) {
		// 触摸已经end了，清除longTap事件
		cancelLongTap();
		// 第二点的距离大于30的时候，触发swipe事件
		if ((touch.x2 && distanceX > 30) || (touch.y2 && distanceY > 30)) {
			swipeTimeout = setTimeout(function(){
				// 触发swipe自定义事件
				event.trigger('swipe', touch.el);
				// 触发swipeLeft等swipe自定义事件
				event.trigger('swipe' + direction(touch.x1, touch.x2, touch.y1, touch.y2), touch.el);
				touch = {};
			}, 0);
		// 否则为tap事件
		// longTap事件时，不执行
		} else if ('last' in touch){
			// 距离小于30的时是tap事件
			if (distanceX < 30 && distanceY < 30) {
				tapTimeout = setTimeout(function() {
					// 单次触摸，并且在事件中增加cancelTouch方法
					if (touch.el) event.trigger('tap', touch.el, {cancelTouch: cancelAll});
					// 两次触摸
					if (touch.isDoubleTap) {
						if (touch.el) event.trigger('doubleTap', touch.el);
						touch = {};
					} else {
						// 单触摸事件
						singleTapTimeout = setTimeout(function(){
							if (touch.el) event.trigger('singleTap', touch.el);
							singleTapTimeout = null;
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

	event.on('touchcancel MSPointerCancel pointercancel', doc, cancelAll);
	event.on('scroll', window, cancelAll);
	
	// 增加touch事件API
	thin.forEach(['tap', 'singleTap', 'longTap', 'doubleTap', 'swipe', 
		'swipeLeft', 'swipeRight', 'swipeTop', 'swipeBottom'], function(eventName) {
		event[eventName] = function(elem, callback) {
			event.on(eventName, elem, callback);
		}
	})

	return event;
})