(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.profile', {
				url		: '/profile',
				params: {name: 'profile'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_profile.html',
						controller : 'ProfileCtrl as ctrl'
					}
				},
				resolve: {
					FormData: function (MainService) {
						return MainService.getData({name: 'profile', group: 'app'});
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.profile', [])
		.config(Config)
	;
})(angular);