/**
 * thin Javasript Library
 * 
 * thin 是一个AMD javascript框架，包含以下模块
 * 
 * - 模块加载
 * - dom操作，类jquery api 操作方式
 * - 事件系统
 * - 路由系统
 * - mvc
 * 
 * @author: stylering
 * 
 * @date: 2012-10-24
 *
 * @github: https://github.com/stylering/thin
 * 
 * @version 1.0.0
 */

(function(global, doc, undefined){
	
	if (global.thin) {
		return;
	}

	var thin = global.thin = {
		vertion: '1.0.0'
	}

	// 缓存系统
	var cache = thin.cache = {};

	/**
	 * @description 类型判断
	 * isString 
	 * isBoolean 
	 * isFunction 
	 * isArray 
	 * isObject 
	 * isNumber
	 */

	// 类型判断函数
	_forEach(
		['String', 'Boolean', 'Function', 'Array', 'Number', 'RegExp'],
		function(v) {
			thin['is' + v] = function(o) {
				return Object.prototype.toString.call(o).slice(8, -1) === v;
			}
		}
	);

	thin.isObject = function(obj) {return typeof obj == 'object'}
	// 普通对象类型
	thin.isPlainObject = function(obj) {return thin.isObject(obj) && !obj.window && Object.getPrototypeOf(obj) == Object.prototype; }
	this.isDocument = function(obj) { return obj != null && obj.nodeType == obj.DOCUMENT_NODE; }
	thin.isWindow = function(obj) { return obj != null && obj == obj.window; }

	/**
	 * @description 外部方法
	 * 
	 * forEach 		数据与对象循环
	 * extend	 	对象扩展
	 * toArray 	类数据转换为数据
	 * ready 	DOM树加载函数
	 */
	_extend(thin, {

		forEach: _forEach,

		extend: _extend,

		toArray: _toArray,

		ready: _ready

	});

	// forEach循环
	function _forEach(obj, iterator, context) {
	  	var key;
	  	if (obj) {
		    if (obj.forEach && obj.forEach !== _forEach) {
		      	obj.forEach(iterator, context);
		    } else {
		      	for (key in obj) {
			        if (obj.hasOwnProperty(key)) {
			          iterator.call(context, obj[key], key);
			        }
		      	}
	    	}
		}
	  	return obj;
	}

	// 对象扩展
	function _extend(target, source) {
		var args = [].slice.call(arguments), i = 1, key,
			ride = typeof args[args.length - 1] == 'Boolean' ? args.pop() : true;

		if (args.length === 1) {
			target = !this.window ? this : {};
			i = 0;
		}

		while (source = args[i++]) {
			for (key in source) {
				if (ride || !(key in target)) {
					target[key] = source[key];
				}
			}
		}
	}

	// 类数组对象转化为数组对象
	function _toArray(a, i, j) {
		return Array.prototype.slice.call(a, i || 0, j || j.length);
	}

	function _ready(fn) {
		var isReady = false,
			arrayFun = [],
			fireReady;

		if (thin.isFunction(fn)) {
			arrayFun.push(fn);
		}

		fireReady = function() {
			if (isReady) return;
			isReady = true;
			while (arrayFun.length) {
				arrayFun.shift()();
			}
		};

		if (doc.addEventListener) {
			doc.addEventListener('DOMContentLoaded', function() {
				doc.removeEventListener('DOMContentLoaded', arguments.callee, false);
				fireReady();
			}, false)
		} else {
			document.write('<script id="ie-ready" defer src="\/\/:"></script>');
			doc.getElementById('ie-ready').onreadystatechange = function() {
				if (this.readyState === 'complete') {
					this.onreadystatechange = null;
					fireReady();
					this.parentNode.removeChild(this);
				}
			}
		}
	}

	/**********************************************************************************
								模块加载系统
	**********************************************************************************/

	var rmakeid = /(#.+|\W)/g,			// url生成序列号作为命名空间
		rAbsolutePath = /^\/\/.|:\//,	// 判断绝对路径
		rRootPath = /^.*?\/\/.*?\//,	// 判断根目录
		rDirName =  /[^?#]*\//,			// 解析url；http://localhost/scripts/require.html ==> http://localhost/scripts/
		rSingleDot = /\/\.\//g, 		// 解析路径 /a/./b/ ==> /a/b/
		rMultiDot = /\/[^/]+\/\.\.\//,	// 解析路径 /a/../b ==> /a/b/
		rMultiSlash = /([^:/])\/+/g, 	// 解析路径 /a///b/ ==> /a//b/ ==> /a/b/
		rWord = /[^, ]+/g; 				// 不等于逗号与空格的字符过滤

	var loaderPath = doc.getElementById('thin-node') || getCurrentPath(true),		// 加载器uri
		loaderDir = dirName(loaderPath),										// 加载器路径
		cwd = dirName(location.href),
		baseDir = loaderDir,
		head = doc.head || doc.getElementsByTagName('head')[0],
		_uid = 0,
		allMods = 'dom event http mvc platform router support touch util',
		anonymousMod;

	function uid() {
		return _uid++;
	}

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
					newData = setBaseDir(newData)
				}
				config[key] = newData;
			}
		}
	}

	config.alias = {};

	var cacheModules = {};	// 缓存加载过的module
	var requestUris = [];	// 需要加载的module uri

	function Module(id, deps) {
		this.id = id;
		this.deps = deps || [];
		this.depsMods = {};
		this.status = 0;
	}

	// 模块状态
	var STATUS = Module.STATUS = {
		SAVED: 1,
		LOADING: 2,
		LOADED: 3,
		EXECUTED: 4
	}

	Module.getModule = function(id, deps) {
		return cacheModules[id] || (cacheModules[id] = new Module(id, deps));
	}
	// 检查模块的依赖
	Module.checkDeps = function() {
		loop: for (var i=0; i<requestUris.length; i++) {
			var mod = cacheModules[requestUris[i]];
			for (var key in mod.depsMods) {
				if (mod.depsMods.hasOwnProperty(key) && cacheModules[mod.depsMods[key].id].status < STATUS.EXECUTED) {
					continue loop;
				}
			}
			if (mod.status < STATUS.EXECUTED) {
				requestUris.splice(i, 1);
				mod.status = STATUS.LOADED;
				mod.exec();
				Module.checkDeps();
			}
		}
	}

	Module.parseUris = function(uris) {
		var ret = [];
		uris = uris ? (thin.isArray(uris) ? uris : [uris]) : [];
		for (var i=0, len=uris.length; i<len; i++) {
			ret.push(idToUris(uris[i]));
		}
		return ret;
	}

	Module.save = function(uri, freeMod) {
		var mod = Module.getModule(uri);

		if (mod.status < STATUS.SAVED) {
			mod.id = freeMod.id || uri;
			mod.deps = freeMod.deps;
			mod.factory = freeMod.factory;
			mod.status = STATUS.SAVED;
		}
	}

	// ['a', 'b'] ==> ['http://localhost/script/a.js', 'http://localhost/script/b.js']
	Module.prototype.parseUris = function() {
		return Module.parseUris(this.deps);
	}

	// 模块执行
	Module.prototype.exec = function() {

		var mod = this;
		var uris = mod.parseUris();
		
		var exports = [];

		for (var i=0, len=uris.length; i<len; i++) {
			exports.push(cacheModules[uris[i]].exports);
		}
		mod.exports = mod.factory.apply(global, exports);
		mod.status = STATUS.EXECUTED;
	}

	// 请求模块
	Module.prototype.request = function() {
		var mod = this;

		function onRequest() {
			if (anonymousMod) {
				Module.save(mod.id, anonymousMod);
				anonymousMod = null;
			}

			// 检测循环依赖
			if (mod.checkCircleDeps(mod.id)) {
				throw new Error(mod.id + '模块与之前的模块存在循环依赖');
			}

			mod.load();
		}

		request(mod.id, onRequest);		
	}

	// 加载模块
	Module.prototype.load = function() {
		var mod = this,
			uris = mod.parseUris(),
			i, j, len = uris.length;

		if (mod.status >= STATUS.LOADING) {
			return;
		}
		mod.status = STATUS.LOADING;
		requestUris.push(mod.id);

		for (i=0; i<len; i++) {
			mod.depsMods[mod.deps[i]] = Module.getModule(uris[i]);
		}

		for (j=0; j<len; j++) {
			var m = cacheModules[uris[j]];

			if (m.status < STATUS.SAVED) {
				m.request();
			} else if (m.status === STATUS.LOADED){
				m.exec();
			}
		}

		Module.checkDeps();
	}

	// 检测是否存在循环依赖
	Module.prototype.checkCircleDeps = function(id) {

		var mod = this,
			deps = mod.deps;

		for (var i=0, len=deps.length; i<len; i++) {
			var m = cacheModules[deps[i]];
			if (m && (m.id === id || m.deps.length && m.checkCircleDeps(id))) {
				return true;
			}
		}
	}

	// 初始请求
	global.require = thin.require = function(deps, factory) {
		var id, mod,
			depsArray = [];

		id = cwd + '_require_' + uid();
		// deps = Module.parseUris(deps);
		if (thin.isString(deps)) {
			deps = deps.replace(/\s*/g, '').split(',');
		}
		mod = Module.getModule(id, deps);
		mod.factory = factory;
		mod.load();
	}
	
	// 模块定义
	global.define = thin.define = function(id, deps, factory) {
		var args, len,
			mod;

		args = Array.prototype.slice.apply(arguments);
		len = args.length;

		if (len === 1) {
			factory = id;
			id = undefined;
			deps = [];
		} else if (len === 2) {
			factory = deps;
			if (thin.isArray(id)) {
				deps = id;
				id = undefined;
			} else {
				deps = [];
			}
		}

		var freeMod = {
			id: idToUris(id),
			deps: deps,
			factory: factory
		}

		freeMod.id ? Module.save(freeMod.id, freeMod) : anonymousMod = freeMod;
	}

	allMods.replace(/[^\s]+/g, function(m) {
		config.alias[m] = baseDir + m + '.js';
	});

	// 设置基础路径
	function setBaseDir(uri) {
		return baseDir = dirName(idToUris(uri));
	}

	// uri转换为路径
	function dirName(uri) {
		return uri.match(rDirName)[0];
	}

	// 对uri进行处理，返回uri的真实路径
	function idToUris(id) {

		if (!id) return '';

		var ret, first, rootPath;
		
		if (thin.config.alias[id]) {	// 已经配置别名
			id = thin.config.alias[id];
			if (thin.isObject(id)) {
				id = id.src;
			}
		}

		first = id.charAt(0);

		if (rAbsolutePath.test(id)) {	// 绝对路径
			ret = id;
		// } else if (first !== '.' && first !== '/') {
		// 	ret = cwd + id;
		} else if (id.slice(0, 2) === './') {	// 相对路径
			ret = cwd + id;
		} else if (id.slice(0, 2) === '..') {	// 父路径
			ret = cwd + id;
		} else if (first === '/') { // 根路径
			rootPath = cwd.match(rRootPath);
			ret = rootPath ? rootPath[0] + id.substring(1) : id;
		} else {
			ret = baseDir + id;
		}
		
		ret = realPath(ret);

		return ret;
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
	function getCurrentPath(base) {
		var scripts, node,
			len, 
			i = 0;

		scripts = (base ? doc: head).getElementsByTagName('script');
		len = scripts.length;
		node = scripts[scripts.length - 1];

		return node.hasAttribute ? node.src : node.getAttribute('src', 4);
	}

	// dom模块作为核心模块加载
	require('dom', function($){ thin.$ = $ });

})(this, document);