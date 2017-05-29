(function (ng) {
	'use strict';

	var NavigationCtrl = function (NavData, MainService, AuthenticateService, $uibModal, $state, $location, $cookies) {
		var self = this,
			navData = NavData
		;
		self.AuthenticateService = AuthenticateService;
		self.$uibModal = $uibModal;
		self.$state = $state;
		self.$location = $location;
		self.$cookies = $cookies;
		self.navigation = navData.nav;
		self.currentUser = MainService.currentUser();
	};
	NavigationCtrl.$inject = ['NavData', 'MainService', 'AuthenticateService', '$uibModal', '$state', '$location', '$cookies'];

	NavigationCtrl.prototype.logout = function () {
		var self = this;
		self.AuthenticateService.logout().then(function (success) {
			// console.log('logout success:', success);
			self.$state.go('auth.login');
		}, function (error) {
			// console.log('logout error:', error);
		});
	};

	NavigationCtrl.prototype.downloadAPK = function () {
		var self = this;
		var modalInstance = self.$uibModal.open({
			animation  : true,
			templateUrl: 'views/app/_download_modal.html',
			backdrop 	 : 'static',
			keyboard   : false,
			controller : ['$scope', '$uibModalInstance', 'MainService',
				function ($scope, $uibModalInstance, MainService) {
					$scope.loading = false;
					$scope.cancel = function () { $uibModalInstance.dismiss('Cancelled'); };
					$scope.downloadLink = MainService.downloadLink;
				}
			]
		});
		modalInstance.result.then(function (data) {

		});
	};

	ng.module('equipmanApp')
		.controller('NavigationCtrl', NavigationCtrl)
	;
})(angular);