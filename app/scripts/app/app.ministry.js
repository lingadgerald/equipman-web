(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.ministries', {
				url		: '/ministries',
				params: {name: 'ministries'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_table.html',
						controller : 'TableCtrl as ctrl'
					}
				},
				resolve: {
					TableObject: function (MainService) {
						return MainService.getData({name: 'ministries', group: 'app'});
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.ministry', [])
		.config(Config)
	;
})(angular);