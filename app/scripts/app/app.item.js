(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.items', {
				url		: '/items',
				params: {name: 'items'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_table.html',
						controller : 'TableCtrl as ctrl'
					}
				},
				resolve: {
					TableObject: function (MainService) {
						return MainService.getData({name: 'items', group: 'app'});
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.item', [])
		.config(Config)
	;
})(angular);