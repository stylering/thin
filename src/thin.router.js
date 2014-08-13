(function(){
	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	// backbone regExp
	var optionalParam = /\((.*?)\)/g;
	var namedParam    = /(\(\?)?:\w+/g;
	var splatParam    = /\*\w+/g;
	var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	var routeStripper = /^[#\/]|\s+$/g;
	var pathStripper = /#.*$/;

	var addEvent = function(elem, type, callback) {
		doc.addEventListener ? elem.addEventListener(type, callback, false) :
			elem.attachEvent('on' + type, callback);
	};

	/**
	 * @descript
	 */
	var Router = {
		options: {
			root: '/'
		},
		routes: [],
		started: false,
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
						callback.call(that, args);
					}
				}
			});
		},
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
					return true;
				}
			});
		},
		navigate: function(fragment, options){
			var url;
			if (!this.started) return;
			options = options || {};
			url = this.root + (fragment = this.getFragment(fragment || ''));
			fragment = fragment.replace(pathStripper, '');
			if (this.fragment === fragment) return;
			this.fragment = fragment;
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
		},
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
		},
		// 开始监听hashchange或popstate事件
		start: function(options) {
			if (this.started === true) return;
			var that = this;
			this.started = true;
			options = options || {};
			this.options.root = options.root || this.options.root;
			// 默认是hash方式
			this.options.hashChange = options.hashChange !== false;
			this.options.hasHashChange = ('onhashchange' in window) && this.options.hashChange;
			this.options.pushState = !!options.pushState;
			// 是否支持HTML5 pushState
			this.options.hasPushState = !!(options.pushState && history.pushState);
			this.fragment = this.getFragment();
			if (this.options.hasPushState) {
				addEvent(window, 'popshate', function(e) { that.loadUrl() });
			} else if (this.options.hasHashChange) {
				addEvent(window, 'hashchange', function(e) { that.loadUrl() });
			}
		},
		loadUrl: function(e) {
			var current,
				item, 
				that = this,
				routes;
			current = this.getFragment();
			if (current === this.current) return;
			routes = this.routes;

			thin.forEach(routes, function(item) {
				if (item.route.test(current)) {
					item.callback(current);
				}
			});
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
			console.log(arr);
			return arr;
		},
		getHash: function(){
			// 去掉#号的hash
			return location.href.match(/#(.*)$/)[1] || '';
		},
		getPath: function() {
			var path
				root;
			path = decodeURI(location.pathname + location.search);
			root = this.root.slice(0, -1);
			if (!path.indexOf(root)) {
				path = path.slice(root.length);
			}
			return path.slice(1);
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
		// 转换正则表达式
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

	thin.router = Router;
}());