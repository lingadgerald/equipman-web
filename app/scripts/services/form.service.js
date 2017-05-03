(function (ng, crypto) {
	'use strict';

	var FormService = function (Backendless, MainService, AuthenticateService, $q, $http) {
		var self = this;
		self.Backendless = Backendless;
		self.AuthenticateService = AuthenticateService;
		self.promiser = MainService.promiser;
		self.$q = $q;
		self.$http = $http;
		self.currentUser = MainService.currentUser();
		self.bService = Backendless.keys;
	};
	FormService.$inject = ['Backendless', 'MainService', 'AuthenticateService', '$q', '$http'];

	FormService.prototype.getData = function (resource, data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			decode = resource.split('@'),
			error = null
		;
		// console.log('resource:', resource);
		if (decode[1] === 'get') {
			self.Backendless.request(resource, data).then(function (success) {
				deferred.resolve(success);
			}, function (error) {
				deferred.reject(error);
			});
		} else {
			error = {message: 'Error getting the data.'};
			deferred.reject();
		}
		return self.promiser(promise);
	};

	FormService.prototype.save = function (resource, data, headers) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise
		;
		self.Backendless.request(resource, data, headers).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	FormService.prototype.bulkSave = function (resource, data, headers) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise
		;
		self.Backendless.bulkRequest(resource, data, headers).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	FormService.prototype.deleteImage = function (imageUrl, headers) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise
		;
		self.Backendless.deleteImage(imageUrl, headers).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	FormService.prototype.createToken = function (data) {
		var hash = crypto.MD5(Date.now() + data.email).toString().toUpperCase();
		for (var i = 8; i< 24; i += 5) {
			hash = hash.splice(i, 0, '-');
		}
		return hash;
	};

	FormService.prototype.activationEmail = function (user) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			subject = 'Email Activation',
			bodyparts = {},
			to = [user.email] || [],
			obj = {}
		;
		var htmlmessage = [
			'<p>',
				'Hello,<br><br>',
				'Before you login and begin working with the application, please confirm',
					'your email address by following the link below:<br><br>',
				'<a href="{link}" target="_blank">Activate account</a><br><br>',
				'Alternatively, you can copy and paste the link above into a browser.',
					'We are excited about you joining our community and would love to help',
					'any way we can.<br><br>',
				'Thanks,<br>Administrator',
			'</p>'
		].join(' ');

		var urlObj = ng.copy(self.bService);
		urlObj.activationToken = user.activationToken;

		// TODO: Change email activation link
		// LINK: email activation
		// obj.link = 'http://127.0.0.1:9000/#/activation/{activationToken}'.format(user);
		obj.link = '{apiUrl}/{applicationId}/{version}/{path}#/activation/{activationToken}'.format(urlObj);
		bodyparts.htmlmessage = htmlmessage.format(obj);

		self.Backendless.activationEmail(subject, bodyparts, to).then(function (success) {
			deferred.resolve(success);
		}, function (error) {
			deferred.reject(error);
		});
		return self.promiser(promise);
	};

	FormService.prototype.changePassword = function (data) {
		var self = this,
			deferred = self.$q.defer(),
			promise = deferred.promise,
			error = null,
			login = {},
			obj = {}
		;
		if (!!self.currentUser) {
			if (!!data.password && data.confirmPassword === data.password) {
				var params = {};
				if (self.currentUser.username === 'admin') {
					params.where = 'email = \'' + self.currentUser.email + '\'';
				} else {
					params.where = 'user.email = \'' + self.currentUser.email + '\'';
				}
				self.Backendless.request('data.user@get', params).then(function (success) {
					obj = ng.copy(success.data[0]);
					obj.password = data.password;
					return self.Backendless.request('data.user@put', obj);
				}).then(function (success) {
					login.login = success.username;
					login.password = obj.password;
					return self.AuthenticateService.logout();
				}).then(function () {
					return self.AuthenticateService.login(login);
				}).then(function (success) {
					deferred.resolve(success);
				}, function (error) {
					deferred.reject(error);
				});
			} else {
				error = {message: 'Confirm password does not match your new password'};
				deferred.reject(error);
			}
		}
		return self.promiser(promise);
	};

	ng.module('equipmanApp')
		.service('FormService', FormService)
	;
})(angular, CryptoJS);