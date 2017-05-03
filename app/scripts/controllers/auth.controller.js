(function (ng) {
	'use strict';

	/* jshint camelcase: false */
	var AuthenticateCtrl = function (AuthData, screenSize, AuthenticateService, $stateParams, $state, toastr, $uibModal) {
		var self = this,
			authData = AuthData
		;
		self.xsMedia = screenSize.is('xs');
		self.smMedia = screenSize.is('sm');
		self.mdMedia = screenSize.is('md');
		self.lgMedia = screenSize.is('lg');

		self.xsMedia = screenSize.on('xs', function (match) {
			self.xsMedia = match;
		});

		self.smMedia = screenSize.on('sm, md, lg', function (match) {
			self.smMedia = match;
		});

		self.mdMedia = screenSize.on('md, lg', function (match) {
			self.mdMedia = match;
		});

		self.lgMedia = screenSize.on('lg', function (match) {
			self.lgMedia = match;
		});

		self.AuthenticateService = AuthenticateService;
		self.$stateParams = $stateParams;
		self.$state = $state;
		self.toastr = toastr;
		self.$uibModal = $uibModal;
		self.name = $stateParams.name;
		self.model = {};
		self.data = {};
		self.options = {};
		self.requiredFields = authData.requiredFields;
		self.fields = (!!authData) ? authData.fields : [];

		self.title = 'SUBMIT';

		if ($stateParams.name === 'login') {
			self.title = 'Log In';
			self.formBtn = 'LOG IN';
		} else if ($stateParams.name === 'register') {
			self.title = 'Register';
			self.formBtn = 'REGISTER';
		} else if ($stateParams.name === 'activation') {
			self.title = 'Account Activation';
			self.formBtn = 'ACTIVATE';
		} else if ($stateParams.name === 'forgot_password') {
			self.title = 'Forgot Password';
			self.formBtn = 'REQUEST RESET PASSWORD LINK';
		} else if ($stateParams.name === 'reset_password') {
			self.title = 'Reset Password';
			self.formBtn = 'RESET PASSWORD';
		}

		self.message = null;
		self.loading = false;
		self.options.formState = {readOnly: self.loading};

		if (self.name === 'activation') {self.checkActivationToken($stateParams);}
		if (self.name === 'reset_password') {self.checkResetPasswordToken($stateParams);}
	};
	AuthenticateCtrl.$inject = ['AuthData', 'screenSize', 'AuthenticateService', '$stateParams', '$state', 'toastr', '$uibModal'];

	AuthenticateCtrl.prototype.onSubmit = function () {
		var self = this;
		self[self.name](self);
	};

	AuthenticateCtrl.prototype.checkActivationToken = function (data) {
		var self = this;
		self.loading = true;
		self.AuthenticateService.checkActivationToken(data).then(function (success) {
			if (success.isValidToken && !!success.user) {
				self.data.objectId = success.user.objectId;
				self.model.user = success.user;
				self.model.email = success.user.email;
				self.model.username = success.user.email;
				self.loading = false;
			} else {
				// self.$state.go('auth.login');
				self.showDialog({title: 'Activation'});
				self.loading = false;
			}
		}, function (error) {
			self.message = error;
			self.loading = false;
		});
	};

	AuthenticateCtrl.prototype.checkResetPasswordToken = function (data) {
		var self = this;
		self.loading = true;
		self.AuthenticateService.checkResetPasswordToken(data).then(function (success) {
			if (success.isValidToken && !!success.user) {
				self.data.objectId = success.user.objectId;
				self.model.__meta = success.user.__meta;
				self.model.objectId = success.user.objectId;
				self.model.userId = success.user.userId;
				self.model.name = success.user.name;
				self.model.email = success.user.email;
				self.model.username = success.user.email;
				self.loading = false;
			} else {
				// self.$state.go('auth.login');
				self.showDialog({title: 'Reset Password'});
				self.loading = false;
			}
		}, function (error) {
			self.message = error;
			self.loading = false;
		});
	};

	AuthenticateCtrl.prototype.activation = function (self) {
		self.loading = true;
		if (self.model.password === self.model.passwordConfirmation) {
			var model = {
				user 		: self.model.user,
				email		: self.model.email,
				username: self.model.username,
				password: self.model.password
			};
			self.AuthenticateService.register(model).then(function (success) {
				return self.AuthenticateService.activateUser(success, self.data);
			}).then(function () {
				self.model = {};
				self.message = null;
				self.loading = false;
				self.$state.go('auth.login');
			}).catch(function (error) {
				self.message = error;
				self.loading = false;
			});
		} else {
			self.message = {message: 'Confirm password must be same to your password'};
			self.loading = false;
		}
	};

	AuthenticateCtrl.prototype.reset_password = function (self) {
		self.loading = true;
		if (!!self.model.password && (self.model.password === self.model.passwordConfirmation)) {
			// console.log(self.model);
			self.AuthenticateService.resetPassword(self.model).then(function (success) {
				self.toastr.success(success.message || 'Success');
				self.model = {};
				self.message = null;
				self.loading = false;
				self.$state.go('auth.login');
			}).catch(function (error) {
				self.message = error;
				self.loading = false;
			});
		} else {
			self.message = {message: 'Confirm password must be same to your password'};
			self.loading = false;
		}
	};

	AuthenticateCtrl.prototype.register = function (self) {
		self.loading = true;
		if (self.model.password === self.model.passwordConfirmation) {
			var model = {
				user 		: self.model.user,
				email		: self.model.email,
				username: self.model.username,
				password: self.model.password
			};
			self.AuthenticateService.register(model).then(function () {
				self.model = {};
				self.message = null;
				self.loading = false;
				self.$state.go('auth.login');
			}, function (error) {
				self.message = error;
				self.loading = false;
			});
		} else {
			self.message = {message: 'Confirm password must be same to your password'};
			self.loading = false;
		}
	};

	AuthenticateCtrl.prototype.login = function (self) {
		self.loading = true;
		if (!self.model.login || !self.model.password) {
			self.message = {message: 'Invalid credentials'};
			self.loading = false;
		} else {
			self.AuthenticateService.isAuthorized(self.model).then(function () {
				return self.AuthenticateService.login(self.model);
			}).then(function () {
				self.$state.go('app.home');
				self.loading = false;
			}).catch(function (error) {
				// console.log('error isAuthorized?', error);
				self.message = error;
				self.loading = false;
			});
		}
	};

	AuthenticateCtrl.prototype.forgot_password = function () {
		var self = this;
		self.loading = true;
		if (!self.model.email) {
			self.message = {message: 'Please enter your email address'};
			self.loading = false;
		} else {
			self.AuthenticateService.checkResetPassword(self.model.email).then(function (success) {
				if (!!success.isValidEmail) {
					var user = success.user;
					user.resetPasswordToken = self.AuthenticateService.createToken(user);
					self.AuthenticateService.resetPasswordEmail(user).then(function () {
						return self.AuthenticateService.sendResetPassword(user);
					}).then(function (success) {
						self.toastr.success(success.message || 'Success');
						// self.toastr.success('Successfully sent reset password to user {email}'.format(self.model));
						self.message = null;
						self.$state.go('auth.login');
						self.loading = false;
					}).catch(function (error) {
						self.message = error;
						self.loading = false;
					});
				} else {
					self.message = {message: 'Invalid email address'};
					self.loading = false;
				}
			});
		}
		// console.log('Forgot Password');
	};

	AuthenticateCtrl.prototype.reset = function () {
		var self = this;
		self.model = {};
		self.readOnly = false;
		self.loading = false;
	};

	AuthenticateCtrl.prototype.showDialog = function (params) {
		var self = this;
		var modalInstance = self.$uibModal.open({
			animation: true,
			template: [
				'<div class="modal-header modal-header primary">',
					'<button type="button" class="close" ng-click="cancel()">&times;</button>',
					'<h4 class="modal-title text-capitalize">{{title}} Error</h4>',
				'</div>',
				'<div class="modal-body">',
					'<p>Sorry, user not found.</p>',
				'</div>',
				'<div class="modal-footer">',
					'<button type="button" class="btn btn-default" ng-click="cancel()">',
						'Close',
					'</button>',
				'</div>'
			].join(' '),
			resolve: {
				params: function () { return params; }
			},
			controller: ['$uibModalInstance', '$scope', 'params', function ($uibModalInstance, $scope, params) {
				$scope.title = params.title;
				$scope.cancel = function () {
					$uibModalInstance.close({error: 'User not found'});
				};
			}]
		});
		modalInstance.result.then(function (data) {
			self.$state.go('auth.login');
		});
	};

	ng.module('equipmanApp')
		.controller('AuthenticateCtrl', AuthenticateCtrl)
	;
})(angular);