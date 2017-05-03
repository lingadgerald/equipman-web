(function (ng) {
	'use strict';

	var Config = function ($stateProvider) {
		$stateProvider
			.state('auth.register', {
				url		: '/register',
				params: {name: 'register'},
				views	: {
					'content@auth': {
						templateUrl: 'views/auth/_auth.html',
						controller : 'AuthenticateCtrl as ctrl'
					}
				},
				resolve: {
					AuthData: function (MainService) {
						return MainService.getData({name: 'register', group: 'auth'});
					}
				}
			})
			.state('auth.login', {
				url		: '/login',
				params: {name: 'login'},
				views	: {
					'content@auth': {
						templateUrl: 'views/auth/_auth.html',
						controller : 'AuthenticateCtrl as ctrl'
					}
				},
				resolve: {
					AuthData: function (MainService) {
						return MainService.getData({name: 'login', group: 'auth'});
					}
				}
			})
			.state('auth.forgot_password', {
				url		: '/forgot_password',
				params: {name: 'forgot_password'},
				views	: {
					'content@auth': {
						templateUrl: 'views/auth/_auth.html',
						controller : 'AuthenticateCtrl as ctrl'
					}
				},
				resolve: {
					AuthData: function (MainService) {
						return MainService.getData({name: 'forgot_password', group: 'auth'});
					}
				}
			})
			.state('auth.reset_password', {
				url		: '/reset_password/:token',
				params: {name: 'reset_password', token: ''},
				views	: {
					'content@auth': {
						templateUrl: 'views/auth/_auth.html',
						controller : 'AuthenticateCtrl as ctrl'
					}
				},
				resolve: {
					AuthData: function (MainService) {
						return MainService.getData({name: 'reset_password', group: 'auth'});
					}
				}
			})
			.state('auth.activation', {
				url		: '/activation/:token',
				params: {name: 'activation', token: ''},
				views	: {
					'content@auth': {
						templateUrl: 'views/auth/_auth.html',
						controller : 'AuthenticateCtrl as ctrl'
					}
				},
				resolve: {
					AuthData: function (MainService) {
						return MainService.getData({name: 'activation', group: 'auth'});
					}
				}
			})
		;
	};
	Config.$inject = ['$stateProvider'];

	ng.module('app.auth', []).config(Config);
})(angular);