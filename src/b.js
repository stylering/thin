define('b', ['c'], function(c) {
	console.log('b.js');
	return {
		bfun1: function() {
			console.log('bfun1')
		}
	}
});
