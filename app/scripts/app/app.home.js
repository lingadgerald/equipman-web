(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.home', {
				url		: '/home',
				params: {name: 'home'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_home.html',
						// controller : ''
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.home', [])
		.config(Config)
	;
})(angular);