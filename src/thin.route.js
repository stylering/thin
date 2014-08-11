(function(){
	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	thin.route = {
		root: '/',
		checkPath: function(path) {
			return path.replace(/^\//, '').replace(/\/$/, '').replace(/(.*)/, '\/$1\/');
		},
		routes: [],
		add: function(o) {
			
		},
		remove: function(o) {
			
		},
		navigator: '',
		config: function(options) {
			// 判断hash路径
			if (options && options.root) {
				this.root = checkPath(options.root);
			}
		}
	}
}());