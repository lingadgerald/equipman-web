(function (ng) {
	'use strict';

	var FormModalCtrl = function (tableData, action, model, $uibModalInstance, FormService, Backendless, toastr) {
		var self = this;
		self.$uibModalInstance = $uibModalInstance;
		self.FormService = FormService;
		self.Backendless = Backendless;
		self.toastr = toastr;
		self.tableData = tableData;
		self.action = action;
		self.originalModel = ng.copy(model);
		self.model = tableData.name !== 'event_item' ? ng.copy(model) : {};
		self.modelName = self.tableData.model.underscoreless();
		self.fields = tableData.formFields;
		self.requiredFields = tableData.requiredFields;
		self.options = {};
		self.deleteName = model.name;

		self.condition = (self.action === 'retrieve' || self.action === 'delete' || self.action === 'destroy');

		var icons = {
			add 		: 'fa-plus',
			view		: 'fa-eye',
			edit 		: 'fa-edit',
			delete 	: 'fa-trash-o',
			retrieve: 'fa-undo',
			destroy	: 'fa-trash-o'
		};

		self.icon = (tableData.model === 'member' && action === 'add') ? 'fa-user-plus' : icons[self.action];

		self.loading = false;
		self.readOnly = (self.condition || action === 'view');
		
		self.options.formState = {
			action	: action,
			readOnly: (self.readOnly || self.loading)
		};

		if (action !== 'add') {self.init();}
	};
	FormModalCtrl.$inject = ['tableData', 'action', 'model', '$uibModalInstance', 'FormService', 'Backendless', 'toastr'];

	FormModalCtrl.prototype.init = function () {
		var self = this;
		self.loading = true;
		var obj = {
			method 		: 'get',
			modalModel: self.tableData.modalModel,
			model 		: self.tableData.model,
			data 			: self.originalModel.objectId
		};
		var arr = [];
		if (self.tableData.name === 'event_item' || self.tableData.name === 'event_attendance') {
			arr = ['data.{modalModel}@{method}'];
		} else {
			arr = ['data.{model}@{method}'];
		}
		if (!!obj.data) {arr.push('@{data}');}
		var resource = arr.join('').format(obj);
		var params = {};
		if ((self.tableData.name === 'event_item' || self.tableData.name === 'event_attendance') &&
				(!!self.tableData.modalTableRelations)) {
			params.loadRelations = self.tableData.modalTableRelations;
		} else if (!!self.tableData.tableRelations) {
			params.loadRelations = self.tableData.tableRelations;
		}

		self.FormService.getData(resource, params).then(function (success) {
			self.loading = false;
			self.model = ng.copy(success);
			self.deleteName = success.name;
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	FormModalCtrl.prototype.ok = function (data) {
		var self = this;
		self.$uibModalInstance.close(data);
	};

	FormModalCtrl.prototype.cancel = function () {
		var self = this;
		self.$uibModalInstance.dismiss('Cancelled');
	};

	// FormModalCtrl.prototype.userEmail = function (to, model) {
	// 	var self = this,
	// 		subject = 'Email Confirmation',
	// 		bodyparts = {},
	// 		obj = {}
	// 	;

	// 	var htmlmessage = [
	// 	'<p>Hello,</p>',
	// 		'<p>Before you login and begin working with the application, please confirm',
	// 			'your email address by following the link below:</p>',
	// 		'<p><a href="{link}" target="_blank">Confirm account</a></p>',
	// 		'<p>Alternatively, you can copy and paste the link above into a browser.',
	// 			'We are excited about you joining our community and would love to help',
	// 			'any way we can.</p>',
	// 		'<p>Thanks,<br>Administrator</p>'
	// 	].join(' ');

	// 	// TODO: Change email activation link.
	// 	obj.link = 'http://127.0.0.1:9000/#/activation/{activationToken}'.format(model);

	// 	bodyparts.htmlmessage = htmlmessage.format(obj);
	// 	self.Backendless.sendEmail(subject, bodyparts, to);
	// };

	FormModalCtrl.prototype.sendData = function () {
		var self = this;
		var methods = {
			add		 	: 'post',
			edit	 	: 'put',
			delete 	: 'put',
			retrieve: 'put',
			destroy	: 'delete'
		};
		var func = {
			member 	: {add: 'memberSave', destroy: 'memberDestroy'},
			ministry: {},
			item 		: {add: 'itemSave', edit: 'itemSave', delete: 'itemSave', destroy: 'itemSave'},
			event		: {},
			event_item: {}
		};
		var obj = {
			method: methods[self.action],
			model : self.tableData.name
		};
		var resource = 'data.{model}@{method}'.format(obj);
		var call = func[obj.model][self.action];

		self.loading = true;
		if (!!call) {
			self[call](self, resource);
		} else {
			self.defaultSave(self, resource);
		}
	};

	FormModalCtrl.prototype.checkRequiredFields = function (action, requiredFields, data) {
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
				if (typeof model.image === 'object' && !!model.image.base64 && !!model.image.filename) {
					model.base64Image = model.image.base64;
					model.image = new Date().getTime() + '_' + (model.image.filename || (model.code + '.png'));
				}
			}
		}
		if (action !== 'add') {model.objectId = data.objectId;}
		if (action === 'delete') {model.deleted = new Date();}
		if (action === 'retrieve') {model.deleted = null;}
		return model || {};
	};

	FormModalCtrl.prototype.defaultSave = function (self, resource) {
		// console.log('Default Save!');
		var model = self.checkRequiredFields(self.action, self.requiredFields, self.model);

		console.log('defaultSave', model);
		if (self.action === 'destroy') {
			resource += '@{objectId}'.format(model);
			model = null;
		}

		self.FormService.save(resource, model).then(function (success) {
			self.toastr.success('Success');
			self.ok(success);
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	FormModalCtrl.prototype.memberSave = function (self, resource) {
		// console.log('Member Save!');
		self.model.name = '{firstname} {lastname}'.format(self.model);
		var model = self.checkRequiredFields(self.action, self.requiredFields, self.model);
		model.activationToken = self.FormService.createToken(model);

		self.FormService.save(resource, model).then(function (success) {
		// TODO: uncomment to send email to user.
			return self.FormService.activationEmail(success);
		}).then(function (success) {
			self.ok(success);
		}).catch(function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	FormModalCtrl.prototype.memberDestroy = function (self, resource) {
		// console.log('Member Destroy!');
		var decode = resource.split('@');
		// console.log(self.model);
		var obj = {
			resource: resource,
			method: decode[1],
			userId: self.model.userId,
			objectId: self.model.objectId
		};

		var userResource = 'data.user@{method}@{userId}'.format(obj);
		var memberResource = '{resource}@{objectId}'.format(obj);
		// console.log('destroy model:', self.model);
		if (!!self.model.activationToken && !self.model.activated) {
			// console.log('With Activation Token');
			self.FormService.save(memberResource).then(function (success) {
				self.ok(success);
			}, function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else if (!self.model.activationToken && !!self.model.activated) {
			// console.log('No Activation Token');
			self.FormService.save(userResource).then(function () {
				return self.FormService.save(memberResource);
			}).then(function (success) {
				self.ok(success);
			}).catch(function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else {
			self.toastr.error('An error occurred', 'Error');
			self.loading = false;
		}
	};

	FormModalCtrl.prototype.itemSave = function (self, resource) {
		// console.log('Item Save!');
		var model = self.checkRequiredFields(self.action, self.requiredFields, self.model);
		var headers = {'Content-Type': 'text/plain'};

		if (model.ownerVal === 'member' && !!model.ownerMinistry) {
			model.ownerMinistry = null;
		} else if (model.ownerVal === 'ministry' && !!model.ownerMember) {
			model.ownerMember = null;
		}
		// console.log(resource);

		if (!!model.image && !self.originalModel.image) {
			// console.log('image:', model, '|', self.originalModel.image);
			self.FormService.save('file.image@put@{image}'.format(model), model.base64Image, headers).then(function (success) {
				// console.log('image save:', success);
				delete model.base64Image;
				model.image = success;
				return self.FormService.save(resource, model);
			}).then(function (success) {
				self.ok(success);
			}).catch(function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else if (!model.image && !!self.originalModel.image) {
			// console.log('image1:', model, '|', self.originalModel.image);
			self.FormService.deleteImage(self.originalModel.image, {}).then(function (success) {
				// console.log('image delete1:', success);
				model.image = null;
				return self.FormService.save(resource, model);
			}).then(function (success) {
				self.ok(success);
			}).catch(function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else if (!!model.image && !!model.base64Image && !!self.originalModel.image) {
			// console.log('image2:', model, '|', self.originalModel.image);
			self.FormService.deleteImage(self.originalModel.image, {}).then(function () {
				return self.FormService.save('file.image@put@{image}'.format(model), model.base64Image, headers);
			}).then(function (success) {
				// console.log('image delete2:', success);
				delete model.base64Image;
				model.image = success;
				return self.FormService.save(resource, model);
			}).then(function (success) {
				self.ok(success);
			}).catch(function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else {
			self.FormService.save(resource, model).then(function (success) {
				// console.log(success);
				self.ok(success);
			}, function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		}

	};

	ng.module('equipmanApp')
		.controller('FormModalCtrl', FormModalCtrl)
	;
})(angular);