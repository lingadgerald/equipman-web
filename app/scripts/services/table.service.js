(function (ng) {
	'use strict';

	var TableService = function (Backendless, MainService, $q, $http) {
		var self = this;
		self.Backendless = Backendless;
		self.promiser = MainService.promiser;
		self.$q = $q;
		self.$http = $http;
		self.searchConditions = self.getSearchConditions();
	};
	TableService.$inject = ['Backendless', 'MainService', '$q', '$http'];

	TableService.prototype.getSearchConditions = function () {
		return {
			nl: '{key} IS NULL',
      nn: '{key} IS NOT NULL',
      eq: '{key} = \'{val}\'',
      ne: '{key} != \'{val}\'',
      bw: '{key} LIKE \'{val}%\'',
      bn: '{key} NOT LIKE \'{val}%\'',
      ew: '{key} LIKE \'%{val}\'',
      en: '{key} NOT LIKE \'%{val}\'',
      cn: '{key} LIKE \'%{val}%\'',
      nc: '{key} NOT LIKE \'%{val}%\'',
      in: '{key} IN (\'{val}\')',
      ni: '{key} NOT IN (\'{val}\')',
		};
	};

	TableService.prototype.getData = function (resource, parameters) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			params = ng.copy(parameters) || {}
		;
		self.Backendless.request(resource, params).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	ng.module('equipmanApp')
		.service('TableService', TableService)
	;
})(angular);