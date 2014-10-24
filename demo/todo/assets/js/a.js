define('a', ['b'], function(b) {
	console.log('a.js');
	return {
		afun1: function() {
			console.log('afun1')
		}
	}
});