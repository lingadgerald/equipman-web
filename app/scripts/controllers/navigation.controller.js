(function (ng) {
	'use strict';

	var NavigationCtrl = function (NavData, MainService, AuthenticateService, $state, $location, $cookies) {
		var self = this,
			navData = NavData
		;
		self.AuthenticateService = AuthenticateService;
		self.$state = $state;
		self.$location = $location;
		self.$cookies = $cookies;
		self.navigation = navData.nav;
		self.currentUser = MainService.currentUser();
	};
	NavigationCtrl.$inject = ['NavData', 'MainService', 'AuthenticateService', '$state', '$location', '$cookies'];

	NavigationCtrl.prototype.logout = function () {
		var self = this;
		self.AuthenticateService.logout().then(function (success) {
			// console.log('logout success:', success);
			self.$state.go('auth.login');
		}, function (error) {
			// console.log('logout error:', error);
		});
	};

	ng.module('equipmanApp')
		.controller('NavigationCtrl', NavigationCtrl)
	;
})(angular);