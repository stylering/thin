/* thin.route.js
 *
 * author stylering
 */

define('router', function() {

	var doc = document;

	// 参考backbone的正则规则
	var optionalParam = /\((.*?)\)/g;
	var namedParam    = /(\(\?)?:\w+/g;
	var splatParam    = /\*\w+/g;
	var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	var routeStripper = /^[#\/]|\s+$/g;
	var pathStripper = /#.*$/;
	var trailingSlash = /\/$/;

	var addEvent = function(elem, type, callback) {
		doc.addEventListener ? elem.addEventListener(type, callback, false) :
			elem.attachEvent('on' + type, callback);
	};

	var removeEvent = function(elem, type, callback) {
		doc.removeEventListener ? elem.removeEventListener(type, callback) :
			elem.dettachEvent('on' + type, callback);
	};

	/**
	 * @description 路由控制，参考backbone
	 * 
	 */
	var Router = {
		root: '/',
		routes: [],
		started: false,
		config: function(options) {
			if (!options || !options.routes) return;

			var routes,
				route,
				callback;
			routes = options.routes;
			if (typeof routes === 'function') {
				routes = routes();
			}
			for (route in routes) {
				(typeof routes[route] === 'string') ? 
					(callback = options[routes[route]] || null) : (callback = routes[route]); 
				this.add(route, callback);
			}
			return this;
		},
		//执行initialize，使用时自己定义扩展
		initialize: function() {},
		// 开始监听hashchange或popstate事件
		start: function(options) {
			if (this.started === true) return;
			this.started = true;
			this.options = options = options || {};
			this.root = options.root || this.root;
			// 默认是hash方式
			this.options.hashChange = options.hashChange !== false;
			this.options.hasHashChange = ('onhashchange' in window) && this.options.hashChange;
			this.options.pushState = !!options.pushState;
			// 是否支持HTML5 pushState
			this.options.hasPushState = !!(options.pushState && history.pushState);
			if (this.options.hasPushState) {
				addEvent(window, 'popstate', this.listener);
			} else if (this.options.hasHashChange) {
				addEvent(window, 'hashchange', this.listener);
			}
			return this.loadUrl();
		},
		// 停止路由监听
		stop: function (argument) {
			removeEvent(window, 'popstate', this.listener);
			removeEvent(window, 'hashchange', this.listener);
			this.started = false;
		},
		// 监听中转函数
		listener: function(e) {
			Router.loadUrl();
		},
		// 根据hash执行回调函数
		loadUrl: function(fragment) {
			var item, routes,
				current;

			if (fragment) {
				current = this.getFragment(fragment);
			} else {
				current = this.getFragment();
				if (current === this.fragment) return;
			}
			this.fragment = current;
			routes = this.routes;
			for (item in routes) {
				if (routes[item].route.test(current)) {
					routes[item].callback(current);
					break;
				}
			}
		},
		/**
		 * 1、增加规则到routes队列中
		 * 2、动态增加路由规则，
		 */
		add: function(route, callback) {
			var args,
				that = this;
			if (!thin.isRegExp(route)) {
				route = this.routeToRegExp(route);
			}
			this.routes.push({
				route: route,
				callback: function(fragment) {
					args = that.extractParameters(route, fragment);
					if (callback) {
						callback.apply(that, args);
					}
				}
			});
			return this;
		},
		// 动态删除路由规则
		remove: function(route) {
			var item, i, 
				routes;
			if (!thin.isRegExp(route)) {
				route = this.routeToRegExp(route);
			}
			routes = this.routes;
			thin.forEach(routes, function(item, i) {
				if (item.route === route) {
					routes.splice(i, 1);
				}
			});
			return this;
		},
		/**
		 *  触发函数监听
		 */
		navigate: function(fragment, options){
			var url;
			if (!this.started) return;
			if (!options || options === true) options = {trigger: !!options};
			url = this.root + (fragment = this.getFragment(fragment || ''));
			fragment = fragment.replace(pathStripper, '');
			if (this.fragment === fragment) return;
			if (fragment === '' && url !== '/') {
				url = url.slice(0, -1);
			}
			if (this.options.hasPushState) {
				// popstate
				history[options.replace ? 'replaceState' : 'pushState']({}, doc.title, url);
			} else if (this.options.hasHashChange) {
				// hashChange
				if (options.replace) {
				  var href = location.href.replace(/(javascript:|#).*$/, '');
				  location.replace(href + '#' + fragment);
				} else {
				  location.hash = '#' + fragment;
				}
			} else {
				return location.assign(url);
			}
			if (options.trigger) return this.loadUrl(fragment);
			return this;
		},
		// 提取正则中的参数
		extractParameters: function(route, fragment) {
			var params = route.exec(fragment).slice(1);
			var arr = [];
			thin.forEach(params, function(param, i) {
				if (i === params.length - 1) {
					arr.push(param || null);
					return;
				}
				arr.push(param ? decodeURIComponent(param) : null);
			});
			return arr;
		},
		getHash: function(){
			// 去掉#号的hash
			var match = location.href.match(/#(.*)$/);
			return match ? match[1] : '';
		},
		// html5的pushState方式， 获取url
		getPath: function() {
			var fragment,
				root;
			fragment = decodeURI(location.pathname + location.search);
			// 去掉最后的"/"
			root = this.root.replace(trailingSlash, '');
			if (!fragment.indexOf(root)) {
				fragment = fragment.slice(root.length);
			}
			return fragment;
		},
		// 获取url中的hash片段
		getFragment: function(fragment) {
			if (fragment == null) {
			  if (this.options.hasPushState || !this.options.hashChange) {
			    fragment = this.getPath();
			  } else {
			    fragment = this.getHash();
			  }
			}
			return fragment.replace(routeStripper, '');
		},
		/**
		 * 转换正则表达式
		 * 对含有“-{}[]+?.,\^$|# ”的字符加上转义字符
		 * 对含有括号的字符串进行处理，使它不捕获不做标号
		 * 对含有(?:与:的字符进行处理，括号括起作为参数
		 * 对*号进行处理，也作为参数
		 */
		routeToRegExp: function (route) {
			route = route.replace(escapeRegExp, '\\$&')
	             .replace(optionalParam, '(?:$1)?')
	             .replace(namedParam, function(match, optional) {
	               return optional ? match : '([^/?]+)';
	             })
	             .replace(splatParam, '([^?]*?)');
			return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
		}
	}

	return Router;
});