(function(){
	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	// 全局事件对象
	var touch = {};
	var distanceX;
	var distanceY;

	var direction = function(x1, x2, y1, y2) {
		return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ?
			((x1 - x2 > 0) ? 'left' : 'right') : ((y1 - y2 > 0) ? 'top' : 'bottom');
	};
	// 清除所有正在执行的触屏事件
	var cancelAll = function() {

	};

	var firstTouch;
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
		if (space > 0 && space <= 250) touch.isDoubleTap = true;
		touch.last = now;
	});

	thin.event.on('touchmove MSPointerMove pointermove', doc, function(e) {
		var	distanceX,
			distanceY;
		
		firstTouch = e.touches[0];
		touch.x2 = firstTouch.pageX;
		touch.y2 = firstTouch.pageY;
		distanceX += Math.abs(touch.x1 = touch.x2);
		distanceY += Math.abs(touch.y1 = touch.y2);
	});

	thin.event.on('touchend MSPointerUp pointerup', doc, function(e) {
		// 第二点的距离大于30的时候，触发swipe事件
		alert(touch.x1 + ' = ' + touch.x2);
		console.log(touch.x1);
		console.log(touch.x2);
		console.log(Math.abs(touch.x1 - touch.x2) > 30);
		if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) || 
			(touch.y2 && Math.abs(touch.y1 - touch.y2) > 30)) {
			thin.event.trigger['swipe' + direction(touch.x1, touch.x2, touch.y1, touch.y2)];
		// 否则为tap事件
		} else {

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