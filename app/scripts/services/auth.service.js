(function (ng, crypto) {
	'use strict';

	var AuthenticateService = function (Backendless, MainService, $q, $http, $cookies, $localStorage) {
		var self = this;
		self.Backendless = Backendless;
		self.MainService = MainService;
		self.promiser = MainService.promiser;
		self.$q = $q;
		self.$http = $http;
		self.$cookies = $cookies;
		self.$localStorage = $localStorage;
		self.bService = Backendless.keys;
	};
	AuthenticateService.$inject = ['Backendless', 'MainService', '$q', '$http', '$cookies', '$localStorage'];

	AuthenticateService.prototype.createToken = function (data) {
		var hash = crypto.MD5(Date.now() + data.email).toString().toUpperCase();
		for (var i = 8; i< 24; i += 5) {
			hash = hash.splice(i, 0, '-');
		}
		return hash;
	};
	AuthenticateService.prototype.resetPasswordEmail = function (user) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			subject = 'Request Reset Password',
			bodyparts = {},
			to = [user.email] || [],
			obj = {}
		;
		var htmlmessage = [
			'<p>',
				'Hello,<br><br>',
				'You are receiving this notification because you have (or someone pretending ',
					'to be you has) requested a new password be sent for your account. ',
					'If you did not request this notification then please ignore it.<br><br>',
				'Link to reset password:',
				'<a href="{link}" target="_blank">Reset Password</a><br><br>',
				'Thanks,<br>Administrator',
			'</p>'
		].join(' ');

		var urlObj = ng.copy(self.bService);
		urlObj.resetPasswordToken = user.resetPasswordToken;

		// TODO: Change reset password link
		// LINK: reset password
		// obj.link = 'http://127.0.0.1:9000/#/reset_password/{resetPasswordToken}'.format(user);
		obj.link = '{apiUrl}/{applicationId}/{version}/{path}#/reset_password/{resetPasswordToken}'.format(urlObj);
		// console.log('link:', obj.link);
		bodyparts.htmlmessage = htmlmessage.format(obj);

		self.Backendless.activationEmail(subject, bodyparts, to).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.register = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise
		;
		self.Backendless.request('auth.register@post', data).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.login = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			error = null
		;
		if (!!data.login && !!data.password) {
			self.Backendless.request('auth.login@post', data).then(function (success) {
				var params = {loadRelations: 'user,user.ministry,user.role'};
				var resource = 'data.user@get@{objectId}'.format(success);
				self.$cookies.put('user-token', success['user-token']);
				return self.Backendless.request(resource, params);
			}).then(function (success) {
				self.$localStorage._equipman_web_user = success.user || success;
				self.MainService.currentUser(self.$localStorage._equipman_web_user);
				deferred.resolve(success);
			}).catch(function (error) {
				deferred.reject(error);
			});
		} else {
			error = {message: 'Invalid login credentials'};
			deferred.reject(error);
		}
		return self.promiser(promise);
	};

	AuthenticateService.prototype.logout = function () {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise
		;
		self.Backendless.request('auth.logout@get').then(function (success) {
			self.$cookies.remove('user-token');
			delete self.$localStorage._equipman_web_user;
			self.MainService.currentUser({});
			self.$localStorage.$reset();
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.isAuthorized = function (user) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			data = {},
			params = {},
			message = null
		;

		if (user.login === 'admin' || user.login === 'iacademyequipman@gmail.com') {
			message = {isAuthorized: true};
			deferred.resolve(message);
		} else {
			if (!!user.login) {data.email = user.login;}

			params.where = 'deleted is null and email = \'{email}\''.format(data);
			params.loadRelations = 'role';
			self.Backendless.request('data.member@get', params).then(function (success) {
				// var role = success.data[0].role;
				if (!!success.data[0] && success.data[0].role.code === 'admin') {
					message = {isAuthorized: true};
					deferred.resolve(message);
				} else {
					message = {
						isAuthorized: false,
						message: 'User is not allowed to access the application'
					};
					deferred.reject(message);
				}
			}, function (error) {
				deferred.reject(error);
			});
		}

		return self.promiser(promise);
	};

	AuthenticateService.prototype.checkActivationToken = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			params = {},
			message = null
		;
		params.where = 'activationToken = \'{token}\' and activated is null'.format(data);
		self.Backendless.request('data.member@get', params).then(function (success) {
			var user = success.data[0];
			if (!!user) {
				message = {isValidToken: true, user: user};
				deferred.resolve(message);
			} else {
				message = {isValidToken: false};
				deferred.resolve(message);
			}
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.checkResetPasswordToken = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			params = {},
			message = null
		;
		params.where = 'resetPasswordToken = \'{token}\''.format(data);
		self.Backendless.request('data.member@get', params).then(function (success) {
			var user = success.data[0];
			if (!!user) {
				message = {isValidToken: true, user: user};
				deferred.resolve(message);
			} else {
				message = {isValidToken: false};
				deferred.resolve(message);
			}
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.checkResetPassword = function (email) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			params = {},
			message = null,
			data = {email: email}
		;
		params.where = 'activated is not null and deleted is null and email = \'{email}\''.format(data);
		self.Backendless.request('data.member@get', params).then(function (success) {
			var user = success.data[0];
			if (!!user) {
				message = {isValidEmail: true, user: user};
				deferred.resolve(message);
			} else {
				message = {isValidEmail: false};
				deferred.resolve(message);
			}
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	AuthenticateService.prototype.activateUser = function (data, user) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			message = null
		;
		if (!!user.objectId) {
			user.activationToken = null;
			user.activated = Date.now();
			user.userId = data.objectId;
			self.Backendless.request('data.member@put', user).then(function (success) {
				message = {message: 'Successfully activated user {email}'.format(success)};
				deferred.resolve(success);
			}, function (error) {
				deferred.reject(error);
			});
		} else {
			message = {};
			deferred.reject(message);
		}
		return self.promiser(promise);
	};

	AuthenticateService.prototype.resetPassword = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			message = null
		;
		if (!!data.userId) {
			var userObj = {password: data.password};
			self.Backendless.request('data.user@put@{userId}'.format(data), userObj).then(function () {
			// 	console.log('user:', user);
			// 	user.password = data.password;
			// 	return self.Backendless.request('data.user@put', user);
			// }).then(function () {
				var obj = {resetPasswordToken: null, resetPasswordSentAt: null, resetPasswordAt: Date.now()};
				return self.Backendless.request('data.member@put@{objectId}'.format(data), obj);
			}).then(function () {
				message = {message: 'Password successfully changed'};
				deferred.resolve(message);
			}).catch(function (error) {
				deferred.reject(error);
			});
			// self.Backendless.request('data.user@put', data).then(function (success) {
			// 	message = {message: 'Successfully reset password for user {email}'.format(success)};
			// 	deferred.resolve(message);
			// }, function (error) {
			// 	deferred.reject(error);
			// });
		} else {
			message = {};
			deferred.reject(message);
		}
		return self.promiser(promise);
	};

	AuthenticateService.prototype.sendResetPassword = function (user) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			message = null
		;
		if (!!user.objectId) {
			user.resetPasswordSentAt = Date.now();
			self.Backendless.request('data.member@put', user).then(function (success) {
				message = {message: 'Successfully sent reset password to user {email}'.format(success)};
				deferred.resolve(message);
			}, function (error) {
				deferred.reject(error);
			});
		} else {
			message = {};
			deferred.reject(message);
		}
		return self.promiser(promise);
	};

	ng.module('equipmanApp')
		.service('AuthenticateService', AuthenticateService)
	;
})(angular, CryptoJS);