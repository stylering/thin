(function(){

	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	var basePath;
	
	var getBasePath = function() {
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

	thin.require = {

	}
}());