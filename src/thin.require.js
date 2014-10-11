(function(){

	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	var basePath;

	var getCurrentScript = function() {
		var nodes = doc.scripts;
		var len = nodes.length;
		var node;
		while (node = nodes[--len]) {
			if (node.readyState === 'interactive' || node.readyState === 'complete') {
				return node.src;
			}
		}
	}

	thin.require = {

	}
}());