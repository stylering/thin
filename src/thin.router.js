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

	var addEvent = function(elem, type, callback) {
		doc.addEventListener ? elem.addEventListener(type, callback, false) :
			elem.attachEvent('on' + type, callback);
	};

	var Router = {
		options: {
			root: '/'
		},
		routes: [],
		started: false,
		checkUrl: function(path) {
			return path.replace(/^\//, '').replace(/\/$/, '').replace(/(.*)/, '\/$1\/');
		},
		add: function(route, callback) {
			if (!thin.isRegExp(route)) {
				route = this.routeToRegExp(route);
			}
			this.routes.push({
				route: route,
				callback: callback
			});
		},
		remove: function(route) {
			var i, routes;
			if (!thin.isRegExp(route)) {
				route = this.routeToRegExp(route);
			}
			routes = this.routes;
			thin.forEach(routes, function(i) {
				if (routes[i].route === route) {
					routes.splice(i, 1);
					return true;
				}
			});
		},
		navigator: function(){

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
				route, i;
			current = this.getFragment();
			if (current === this.current) return;
			thin.forEach(this.routes, function(i) {
				if (this.routes[i].route.test(current)) {
					this.routes[route](fragment);
					return true;
				}
			});
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