(function(){

	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	var basePath;
	
	var Module = function() {
		this.id = ''
		this.deps = '',
		this.factory = ''
	}

	Module.status = {
		LOADING: 0,
		LOADED: 1
	}

	win.require = thin.require = function(list, factory) {

	}
	
	win.define = thin.define = function(id, deps, factory) {

	}

	// 获取加载器的路径地址
	function getBasePath() {
		var scripts, script,
			len, 
			i = 0;

		scripts = doc.getElementsByTagName('script');
		len = scripts.length;
		if (window.VBArray) {	// for low IE
			for (; script=scripts[--len]; ) {
				if (script.readyState === 'interactive') break;
			}
		} else {
			script = scripts[len - 1];
		}
		return script.src || script.getAttribute('src', 4);
	}

}());