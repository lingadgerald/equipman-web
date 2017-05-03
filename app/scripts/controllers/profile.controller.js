(function (ng) {
	'use strict';

	var ProfileCtrl = function (FormData, MainService, FormService, toastr) {
		var self = this,
			formData = FormData
		;
		self.MainService = MainService;
		self.FormService = FormService;
		self.toastr = toastr;
		self.currentUser = MainService.currentUser();

		self.formData = formData;
		self.tabs = formData.tabs;
		self.tab = self.tabs[0];
		self.tabData = formData.tabData[self.tab.model];

		self.name = self.tabData.name;
		self.heading = self.tabData.heading;
		self.title = self.tabData.title;
		self.icon = self.tabData.icon;
		self.fields = self.tabData.formFields;
		self.tableRelations = self.tabData.tableRelations;
		self.requiredFields = self.tabData.requiredFields;
		self.model = ng.copy(self.currentUser) || {};
		self.options = {
			formState: {
				currentUser: self.currentUser
			}
		};

		self.active = self.tab.model || 'active';

		self.init();
	};
	ProfileCtrl.$inject = ['FormData', 'MainService', 'FormService', 'toastr'];

	ProfileCtrl.prototype.init = function () {
		var self = this,
			params = {},
			obj = {objectId: self.currentUser.objectId}
		;
		console.log(self.currentUser);
		self.loading = true;

		if (!!self.tableRelations) {params.loadRelations = self.tableRelations;}
		
		if (self.currentUser.username !== 'admin') {
			obj.model = 'member';
		} else {
			obj.model = 'user';
		}

		var resource = 'data.{model}@get@{objectId}'.format(obj);
		self.FormService.getData(resource, params).then(function (success) {
			self.loading = false;
			self.model = (!!success.user) ? success.user : success;
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	ProfileCtrl.prototype.tabReload = function (tab) {
		var self = this;
		self.active = tab.model;
		self.tab = tab;
		self.tabData = self.formData.tabData[tab.model];

		self.name = self.tabData.name;
		self.heading = self.tabData.heading;
		self.title = self.tabData.title;
		self.icon = self.tabData.icon;
		self.fields = self.tabData.formFields;

		if (self.name === 'edit_profile') {self.init();}
	};

	ProfileCtrl.prototype.checkRequiredFields = function (action, requiredFields, data) {
		var model = {};
		if (action === 'add') {
			ng.forEach(requiredFields, function (val) {
				if (val === 'code') {
					model[val] = data.name.trim().underscore();
				} else if (!!data[val] && (val === 'name' || val === 'firstname' || val === 'lastname' || val === 'itemId' || val === 'location')) {
					model[val] = data[val].trim();
				} else if (!!data[val] && val === 'image') {
					model[val] = new Date().getTime() + '_' + data[val].filename;
					model.base64Image = data[val].base64;
				} else {
					model[val] = data[val];
				}
			});
		} else {
			model = ng.copy(data);
			if (requiredFields.indexOf('image') > -1 && !!model.image) {
				// console.log('image found');
				model.base64Image = model.image.base64;
				model.image = new Date().getTime() + '_' + (model.image.filename || model.code + '.png');
			}
		}
		if (action !== 'add') {model.objectId = data.objectId;}
		if (action === 'delete') {model.deleted = new Date();}
		if (action === 'retrieve') {model.deleted = null;}
		return model || {};
	};

	ProfileCtrl.prototype.onSubmit = function () {
		var self = this;
		self.loading = true;
		if (self.name === 'edit_profile') {
			self.FormService.save('data.member@put', self.model).then(function (success) {
				self.toastr.success('Profile successfully changed');
				self.loading = false;
			}, function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else if (self.name === 'change_password') {
			if (!!self.model.password && self.model.confirmPassword === self.model.password) {
				self.FormService.changePassword(self.model).then(function (success) {
					self.MainService.currentUser(success);
					self.model = {};
					self.toastr.success('Password successfully changed');
					self.loading = false;
				}, function (error) {
					self.toastr.error(error.message, 'Error');
					self.loading = false;
				});
			} else {
				self.toastr.error('Confirm password does not match your new password', 'Error');
				self.loading = false;
			}
		}
	};

	ng.module('equipmanApp')
		.controller('ProfileCtrl', ProfileCtrl)
	;
})(angular);