(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.members', {
				url		: '/members',
				params: {name: 'members'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_table.html',
						controller : 'TableCtrl as ctrl'
					}
				},
				resolve: {
					TableObject: function (MainService) {
						return MainService.getData({name: 'members', group: 'app'});
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.user', [])
		.config(Config)
	;
})(angular);