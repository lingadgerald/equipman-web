(function (ng) {
	'use strict';

	var TableModalCtrl = function (tableData, action, model, $uibModalInstance, NgTableParams, FormService, Backendless, toastr) {
		var self = this;
		self.$uibModalInstance = $uibModalInstance;
		self.FormService = FormService;
		self.Backendless = Backendless;
		self.toastr = toastr;
		self.tableData = tableData;
		self.action = action;
		self.originalModel = ng.copy(model);
		self.model = ng.copy(model);
		self.fields = tableData.formFields;
		self.requiredFields = tableData.requiredFields;
		self.options = {};
		// self.deleteName = model.name;

		self.limit = 10;
		self.selected = [];
		self.formTableData = [];
		self.tableFields = tableData.tableModalFields;
		self.index = 0;
		self.message = null;
		self.conditions = {};
		if (self.active === 'active') {
			self.conditions.where = 'deleted IS NULL';
		} else if (self.active === 'inactive') {
			self.conditions.where = 'deleted IS NOT NULL';
		}
		if (!!tableData.loadRelations) {
			self.conditions.loadRelations = tableData.loadRelations;
		}
		self.item = {
			selected: false
		};

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

		self.sort = {
			name: 'created',
			reversed: false
		};

		var tableParams = {
			params 	: {page: 1, count: self.limit, sorting: {created: 'desc'}},
			settings: {
				getData: function (parameters) {
					self.loading = true;
					var page = parameters.page() - 1,
						limit = parameters.count(),
						sidx = parameters.orderBy(),
						sort = 'asc'
					;
					self.limit = limit;
					sidx = sidx[0] || '+created';

					if (!!sidx) {
						if (sidx[0] === '-') {sort = 'desc';}
						sidx = sidx.slice(1);
					}

					var sortBy = sidx + ' ' + sort;

					var params = {
						pageSize		 : limit,
						offset			 : page * limit,
						sortBy			 : sortBy,
						where				 : self.conditions.where
					};
					var ids = [];

					if (!!self.originalModel && self.originalModel.items.length > 0) {
						ng.forEach(self.originalModel.items, function (val) {
							ids.push(val.objectId);
						});
						params.where = 'deleted IS NULL and objectId NOT IN (\'' + ids.join('\',\'').toString() + '\')';
					}

					if (!!tableData.modalLoadRelations) {
						params.loadRelations = tableData.modalLoadRelations;
					}
					// var tempData = [];
					// var total = 0;
					var resource = 'data.{modalModel}@get'.format(tableData);
					return self.Backendless.request(resource, params).then(function (success) {
						parameters.total(success.totalObjects);
						self.formTableData = success.data;
						// self.index = params.offset;
						// self.init(success.data);
						self.loading = false;
						return self.formTableData;
						// return success.data;
					}, function (error) {
						self.message = error;
						self.loading = false;
					});
				}
			}
		};

		self.tableParams = new NgTableParams(tableParams.params, tableParams.settings);

		// if (action !== 'add') {self.init();}
		// self.init();
	};
	TableModalCtrl.$inject = ['tableData', 'action', 'model', '$uibModalInstance', 'NgTableParams', 'FormService', 'Backendless', 'toastr'];

	TableModalCtrl.prototype.init = function (formTableData) {
		var self = this;
		var conditions = {
			where: 'event.objectId = \'{objectId}\''.format(self.model)
		};
		if (!!self.conditions.loadRelations) {
			conditions.loadRelations = self.conditions.loadRelations;
		}
		var resource = 'data.event_item@get';

		self.FormService.getData(resource, conditions).then(function (success) {
			// self.tableFields = success.data;
			var responseData = ng.copy(formTableData);
			// console.log('data', responseData);
			ng.forEach(formTableData, function (data) {
				ng.forEach(success.data, function (val) {
					// console.log('res:', responseData);
					if (data.objectId === val.item.objectId) {
						// console.log('true:', data.objectId, '|', val.item.objectId);
						var index = responseData.indexOf(data);
						responseData.splice(index, 1);
					}
				});
			});
			// console.log('init:', success);
			self.formTableData = responseData;
			self.loading = false;
			return self.formTableData;
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	TableModalCtrl.prototype.sortData = function (field) {
		var self = this;
		if (!!field.sort) {
			self.sort.name = field.model;
			self.sort.reversed = self.tableParams.isSortBy(field.sort, 'asc');
			self.tableParams.sorting(field.sort, (self.sort.reversed) ? 'desc' : 'asc');
		}
	};

	TableModalCtrl.prototype.ok = function (data) {
		var self = this;
		self.$uibModalInstance.close(data);
	};

	TableModalCtrl.prototype.cancel = function () {
		var self = this;
		self.$uibModalInstance.dismiss('Cancelled');
	};

	TableModalCtrl.prototype.showField = function (col, row) {
		var field = col.model,
			value = '',
			fields = null
		;

		if (field) {
			value = row;
			fields = field.split('.');
			ng.forEach(fields, function (f) {
				value = value[f] || '';
			});
		}
		return value;
	};

	TableModalCtrl.prototype.showOwner = function (col, row) {
		var self = this,
			ownerVal = self.showField(col, row),
			owner = null
		;
		
		if (ownerVal === 'ministry') {
			owner = row.ownerMinistry.name;
		} else if (ownerVal === 'member') {
			owner = row.ownerMember.name;
		}
		return owner;
	};

	TableModalCtrl.prototype.showImage = function (col, row) {
		var self = this,
			image = self.showField(col, row),
			imageLink = 'http://placehold.it/300?text=Add+Image'
		;

		if (!!image) {imageLink = image;}
		return imageLink;
	};

	// TableModalCtrl.prototype.toggleAll = function () {
	// 	var self = this;
	// 	console.log(self.formTableData.length, '|', self.selected.length);
	// 	if (self.formTableData.length === self.selected.length) {
	// 		ng.forEach(self.formTableData, function (val) {
	// 			val.selected = false;
	// 		});
	// 		self.selected.splice(0, self.selected.length);
	// 		self.item.selected = false;
	// 	} else {
	// 		if (self.selected.length > 0) {
	// 			self.selected.splice(0, self.selected.length);
	// 		}
	// 		ng.forEach(self.formTableData, function (val) {
	// 			val.selected = true;
	// 			self.selected.push(val);
	// 		});
	// 		self.item.selected = true;
	// 	}
	// 	console.log('toggleAll:', self.selected);
	// };

	TableModalCtrl.prototype.toggleSelection = function (data) {
		var self = this,
			index = self.selected.indexOf(data)
		;
		if (index > -1) {
			self.selected.splice(index, 1);
		} else {
			self.selected.push(data);
		}
		data.selected = !data.selected;
		if (self.formTableData.length <= self.selected.length) {
			self.item.selected = true;
		} else {
			self.item.selected = false;
		}
		// console.log(index, self.selected, '|', data.objectId);
	};

	TableModalCtrl.prototype.sendData = function () {
		var self = this;
		// console.log(self.selected);
		var methods = {
			add		 	: 'post',
			edit	 	: 'put',
			delete 	: 'put',
			retrieve: 'put',
			destroy	: 'delete'
		};
		// var func = {
		// 	member 	: {add: 'memberSave', destroy: 'memberDestroy'},
		// 	ministry: {},
		// 	item 		: {add: 'itemSave', edit: 'itemSave', destroy: 'itemSave'},
		// 	event		: {}
		// };
		var obj = {
			method: methods[self.action],
			model : self.tableData.model
		};
		var resource = 'data.{model}@{method}'.format(obj);
		// var call = func[obj.model][self.action];

		self.loading = true;
		// if (!!call) {
		// 	self[call](self, resource);
		// } else {
		// 	self.defaultSave(self, resource);
		// }
		// console.log(resource);
		self.save(self, resource);
	};

	TableModalCtrl.prototype.save = function (self, resource) {
		var selected = ng.copy(self.selected);
		// console.log('originalModel:', self.originalModel);
		var obj = {
			objectId: self.originalModel.objectId,
			items: selected
		};

		resource = 'data.event@put';
		self.FormService.save(resource, obj).then(function (success) {
			// console.log('event items save:', success);
			self.ok(success);
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	ng.module('equipmanApp')
		.controller('TableModalCtrl', TableModalCtrl)
	;
})(angular);