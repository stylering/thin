define('a', ['b', 'c'], function(b, c) {
	console.log('a.js');
	return {
		afun1: function() {
			console.log('afun1')
		}
	}
});