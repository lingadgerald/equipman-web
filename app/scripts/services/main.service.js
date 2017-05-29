(function (ng) {
	'use strict';

	var MainService = function (Backendless, $q, $http, $localStorage) {
		var self = this;
		self.$q = $q;
		self.$http = $http;
		self.$localStorage = $localStorage;
		self.data = {};
		self.downloadLink = [
			'https://develop.backendless.com',
			'/3.x',
			'/console',
			'/{applicationId}',
			'/appversion',
			'/A65CE0E2-01FD-BF1C-FF1B-14B4E6B0A200',
			'/dtwqbrwkqkppjccbcfftkeislmpuehbdrscj',
			'/files/download/downloads'
		].join('').format(Backendless.keys);
		// self.imageLink = '{apiUrl}/{applicationId}/{version}/files/images'.format(Backendless.keys);
	};
	MainService.$inject = ['Backendless', '$q', '$http', '$localStorage'];

	MainService.prototype.promiser = function (promise) {
		promise.success = function (data) {
			promise.then(data);
			return promise;
		};
		promise.error = function (data) {
			promise.then(null, data);
			return promise;
		};
		return promise;
	};

	MainService.prototype.getData = function (parameters) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			obj = ng.copy(parameters),
			url = 'data/{group}/{name}.json'.format(obj)
		;

		if (self.data[obj.name] === null || self.data[obj.name] === undefined) {
			self.$http.get(url).then(function (success) {
				self.data[obj.name] = success.data;
				deferred.resolve(self.data[obj.name]);
			}, function (error) {
				deferred.reject(error);
			});
		} else {
			deferred.resolve(self.data[obj.name]);
		}
		return self.promiser(promise);
	};

	MainService.prototype.currentUser = function (user) {
		var self = this;
		if (!!user) {self.$localStorage._equipman_web_user = user;}
		return self.$localStorage._equipman_web_user;
	};

	MainService.prototype.localStorage = function (key, value) {
		var self = this;
		if (!!value) {self.$localStorage[key] = value;}
		return self.$localStorage;
	};

	ng.module('equipmanApp')
		.service('MainService', MainService)
	;
})(angular);