(function (ng) {
	'use strict';

	var Config;
	Config = function ($stateProvider) {
		$stateProvider
			.state('app.events', {
				url		: '/events',
				params: {name: 'events'},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_table.html',
						controller : 'TableCtrl as ctrl'
					}
				},
				resolve: {
					TableObject: function (MainService) {
						return MainService.getData({name: 'events', group: 'app'});
					}
				}
			})
			.state('app.events.details', {
				url		: '/:title/details',
				params: {name: 'event_items', title: '', sub: 'items', data: ''},
				views	: {
					'content@app': {
						templateUrl: 'views/app/_event_details.html',
						controller : 'EventItemCtrl as ctrl'
					}
				},
				resolve: {
					TableObject: function (MainService) {
						return MainService.getData({name: 'event_details', group: 'app'});
					}
				}
			})
		;
	};

	Config.$inject = ['$stateProvider'];
	ng.module('app.event', [])
		.config(Config)
	;
})(angular);