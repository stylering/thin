(function(){

	var win = window;
	var doc = document;
	var thin = win.thin || (win.thin = {});

	var basePath;
	var head = doc.head || doc.getElementsByTagName('head')[0];

	/*需要用到的正则表达式
	 */
	
	// url生成序列号作为命名空间
	var rmakeid = /(#.+|\W)/;

	var Module = function() {
		this.id = ''
		this.deps = '',
		this.factory = ''
	}

	Module.status = {
		LOADING: 0,
		LOADED: 1,
		EXECUTING: 2,
		EXECUTED: 3 
	}

	win.require = thin.require = function(list, factory) {

	}
	
	win.define = thin.define = function(id, deps, factory) {

	}

	// 加载js和css资源文件
	function requestSource(src) {
		var node;

		if (/.js$/.test(src)) {	// 加载js
			var onloadSupport = 'onload' in node;
			node = doc.createElement('script');

			function onload() {
				if (onloadSupport || /loaded|complete/i.test(node.readyState)) {
					console.log('ddddd');
				}
			}
			onloadSupport ? node.onload = onload : node.onreadystatechange = onload;
			node.onerror = function() {
				console.log('error');
			}
			node.src = src;
			head.appendChild(node);
		} else if (/.css$/.test(src)) {		// 加载css
			var id = src.replace(rmakeid, '');
			if (!doc.getElementById(id)) {
				node = doc.createElement('link');
				node.rel = 'stylesheet';
				node.href = src;
				node.id = id;
				head.appendChild(node);
			}
		}
	}

	// 获取加载器的路径地址
	function getCurrentPath() {
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