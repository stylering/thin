(function(){
	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	// backbone regExp
	var optionalParam = /\((.*?)\)/g;
	var namedParam    = /(\(\?)?:\w+/g;
	var splatParam    = /\*\w+/g;
	var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	var Router = {
		root: '/',
		routes: undefined,
		fragment: undefined,
		checkUrl: function(path) {
			return path.replace(/^\//, '').replace(/\/$/, '').replace(/(.*)/, '\/$1\/');
		},
		add: function(o) {
			
		},
		remove: function(o) {
			
		},
		navigator: function(){
			
		},
		config: function(options) {
			options || options = {};
			if (options.routes) {
				this.routes = options.routes;
			}
			this._bindHandles();
		},
		route: function (route, callback) {
			
		},
		start: function() {

		},
		_bindRoutes: function(){
			var routes,
				route;

			routes = this.routes;
			if (!routes) return;
			if (typeof routes === 'function') {
				routes = this.routes = routes();
			}
			for (route in routes) {
				this.route(route, routes[route]);
			}
		},
		_getFragment function() {

		},
		// 转换正则表达式
		_routeToRegExp: function (route) {
			route = route.replace(escapeRegExp, '\\$&')
	             .replace(optionalParam, '(?:$1)?')
	             .replace(namedParam, function(match, optional) {
	               return optional ? match : '([^/?]+)';
	             })
	             .replace(splatParam, '([^?]*?)');
			return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
		},
	}

	thin.router = Router;
}());