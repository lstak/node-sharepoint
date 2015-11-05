var assert = require('assert');
var SP = require('../src/sharepoint.js');


describe('Array', function () {
	describe('#indexOf()', function () {
		it('should return -1 when the value is not present', function () {
			assert.equal(-1, [1, 2, 3].indexOf(5));
			assert.equal(-1, [1, 2, 3].indexOf(0));
		});
	});
});

describe('Require for', function () {
	describe('Module "SP"', function () {
		it('should not be null', function () {
			assert.notEqual(SP, null);
		});
	});
});
describe('The constructor for', function () {
	describe('Module "SP"', function () {
		it('should not be null', function () {
			assert.notEqual(
				new SP.RestService('http://classsolutions.sharepoint.com/sites/DevAraujo'),
				null);
		});
	});
});