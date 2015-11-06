var assert = require('assert');

describe('Start Connection Test', function () {
	var SP;
	before(function () {
		SP = require('../temp/sharepoint.js');
	});
	describe('Testing Module "SP"', function () {
		it('Require should not be null', function () {
			assert.notEqual(SP, null);
		});
	});
	describe('Constructor for SP.RestService', function () {
		var client;
		before(function () {
			client = new SP.RestService('http://classsolutions.sharepoint.com/sites/DevAraujo');
		});
		it('should not be null', function () {
			assert.notEqual(client, null);
		});
		it('the client should connect', function (done) {
			this.timeout(1500);
			assert.doesNotThrow(
				function () {
					client.signin('xxx@class-solutions.com.br', 'xxx', function (err, data) {
						done(err);
					});
				},
				function (error) {
					return done(error);
				},'Error :|');
		});
	});
});
