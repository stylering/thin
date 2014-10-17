(function(){

	var win = window,
		doc = document,
		thin = win.thin || (win.thin = {});

	var rmakeid = /(#.+|\W)/g,			// url生成序列号作为命名空间
		rAbsolutePath = /^\/\/.|:\//,	// 判断绝对路径
		rRootPath = /^.*?\/\/.*?\//,	// 判断根目录
		rDirName =  /[^?#]*\//,		// 解析url；http://localhost/scripts/require.html ==> http://localhost/script/demo/
		rSingleDot = /\/\.\//g, 		// 解析路径 /a/./b/ ==> /a/b/
		rMultiDot = /\/[^/]+\/\.\.\//,	// 解析路径 /a/../b ==> /a/b/
		rMultiSlash = /([^:/])\/+/g, 	// 解析路径 /a///b/ ==> /a//b/ ==> /a/b/
		rWord = /[^, ]+/g; 				// 不等于逗号与空格的字符过滤

	var basePath = getCurrentPath().match(rDirName)[0],
		basedir = location.href.match(rDirName)[0],
		head = doc.head || doc.getElementsByTagName('head')[0],
		_uid = 0;

	// 自定义选项配置，配置别名等
	var config = thin.config = function(configData) {
		var key, k;
		for (key in configData) {
			var newData = configData[key];
			var curData = config[key];

			if (curData && thin.isObject(newData)) {
				for (k in newData) {
					curData[k] = newData[k];
				}
			} else {
				if (thin.isArray(curData)) {
					newData = curData.concat(newData);
				} else if (key === 'base') {
					newData = setBasePath(newData)
				}
				config[key] = newData;
			}
		}
	}
	config.alias = {};

	var cacheModules = {};

	function Module(uri, deps, factory) {
		this.uri = uri;
		this.deps = deps || [];
		this.depsMods = {};
		this.factory = factory;
		this.exports = {};
		this.status = 0;
		this._remain = 0;
		this._entry = [];
	}

	// 模块状态
	var STATUS = Module.STATUS = {
		LOADING: 1,
		LOADED: 2,
		EXECUTING: 3,
		EXECUTED: 4
	}

	Module.getModule = function(id, deps) {
		return cacheModules[id] || (cacheModules[id] = new Module(id, deps));
	}

	Module.prototype.parseUri = function() {
		var mod = this,
			deps = mod.deps,
			i = 0, len = deps.length,
			uris = [];
		for (; i<len; i++) {
			uris.push(parsePath(deps[i]));
		}
		return uris;
	}

	Module.prototype.execute = function() {
		var mod = this;

		var pMod = mod.parentMod;
		mod.exports = mod.factory();
		while (pMod) {
			pMod._remain--;
			pMod._args.push(mod.exports);
			if (pMod._remain === 0) {
				pMod.exports = pMod.factory.apply(pMod._args);
				console.log(pMod.exports);
			}
			pMod = pMod.parentMod;
		}
	}

	Module.prototype.pass = function() {
		var mod = this;
		var len = mod.deps.length;
		var count = 0;
		
		for (var i=0, l=mod._entry.length; i<l; i++) {
			for (var j=0; j<len; j++) {		
				var m = mod.depsMods[mod.deps[j]];
				if (m.status < STATUS.LOADED) {
					count++;
					m._entry.push(mod._entry[i])
				}
			}
			if (count > 0) {
			  entry.remain += count - 1
			  mod._entry.shift()
			  i--
			}
		}
	}

	Module.prototype.load = function() {
		var mod = this,
			uris = mod.parseUri(),
			i, len = uris.length;

		if (mod.status > STATUS.LOADING) return;
		mod.status = STATUS.LOADING;

		if (len) {
			for (i=0; i<len; i++) {
				mod.depsMods[mod.deps[i]] = Module.getModule(uris[i]);
			}
			mod.pass();
			// var m = cacheModules[uris[i]];
			// var callback = function(){}
			// m.status = STATUS.LOADING;
			// m.parentMod = mod;
			// mod._remain++;
			// request(m.uri, callback);
		} else {
			mod.execute();
		}
	}

	win.require = thin.require = function(deps, factory) {
		var id, mod;

		id = basedir + '_require_' + uid();
		deps = thin.isArray(deps) ? deps : [deps];
		mod = Module.getModule(id, deps);
		mod.factory = factory;
		mod._entry.push(mod);
		mod.load();
	}
	
	win.define = thin.define = function(id, deps, factory) {
		var args, len,
			mod;

		args = Array.prototype.slice.apply(arguments);
		len = args.length;

		if (len === 1) {
			factory = id;
		} else if (len === 2) {
			factory = deps;
			thin.isString(id) ? deps = [] : deps = id;
		}

		id = id ? parsePath(id) : getCurrentPath();
		mod = Module.getModule(id);
		mod.uri = id;
		mod.deps = deps;
		mod.factory = factory;
		mod.status = Module.STATUS.LOADED;
		mod.load();
	}

	function uid() {
		return _uid++;
	}

	function setBasePath(uri) {
		return parsePath(uri).match(rDirName)[0];
	}

	// 对uri进行处理，返回uri的真实路径
	function parsePath(id) {
		var ret, first, rootPath;
		
		if (thin.config.alias[id]) {	// 已经配置别名
			if (typeof ret === 'object') {
				ret = ret.src;
			}
			return ret = thin.config.alias[id];
		}

		first = id.charAt(0);
		if (rAbsolutePath.test(id)) {	// 绝对路径
			ret = id;
		} else if (first !== '.' && first !== '/') {
			ret = basePath + id;
		} else if (first === '.') {	// 相对路径
			ret = basePath + id;
		} else if (first === '/') { // 根路径
			rootPath = basePath.match(rRootPath);
			ret = rootPath ? rootPath[0] + id.substring(1) : id;
		} else {
			ret = basePath + id;
		}

		return realPath(ret);
	}
	// 对特殊的uri进行处理
	// /a/./b/  ==> /a/b/
	// /a/../b/ ==> /a/b/
	// /a////b/ ==> /a/b/
	function realPath(uri) {
		uri = uri.replace(rSingleDot, '/').replace(rMultiSlash, '$1/');
		while(uri.match(rMultiDot)) {
			uri = uri.replace(rMultiDot, '/');
		}
		// 文件名加上.js/.css后缀名
		if (!/\.(js|css)$/.test(uri)) {
			uri += '.js';
		}
		return uri;
	}

	// 加载js和css资源文件
	function request(src, callback) {
		var node;

		if (/.js$/.test(src)) {	// 加载js
			node = doc.createElement('script');
			var onloadSupport = 'onload' in node;

			function onload() {
				if (onloadSupport || /loaded|complete/i.test(node.readyState)) {
					callback();
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