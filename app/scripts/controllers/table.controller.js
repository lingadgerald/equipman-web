(function (ng) {
	'use strict';

	var TableCtrl = function (TableObject, TableService, FormService, NgTableParams, $uibModal, $state, $stateParams, toastr, FileSaver) {
		var self = this, tableObject = TableObject;
		
		self.TableService = TableService;
		self.FormService = FormService;
		self.NgTableParams = NgTableParams;
		self.$uibModal = $uibModal;
		self.$state = $state;
		self.$stateParams = $stateParams;
		self.toastr = toastr;
		self.FileSaver = FileSaver;

		self.tableObject = tableObject;
		self.name = tableObject.name;
		self.heading = tableObject.heading;
		self.title = tableObject.title;
		self.icon = tableObject.icon;
		self.tabs = tableObject.tabs;
		self.tableFields = tableObject.tableFields;
		self.formFields = tableObject.formFields;
		self.searchFields = tableObject.searchFields;
		self.tableRelations = tableObject.tableRelations;

		self.tableData = [];
		self.tab = self.tabs[0];
		self.active = self.tab.model || 'active';
		self.message = null;
		self.loading = false;
		self.conditions = {};

		self.whereCondition = '';
		if (self.active === 'active') {
			self.whereCondition = 'deleted IS NULL';
		} else if (self.active === 'inactive') {
			self.whereCondition = 'deleted IS NOT NULL';
		}

		self.search = {};
		self.searchConditions = TableService.searchConditions;
		self.sort = {name: 'created', reversed: false};

		self.helper = {csv: null};

		self.tableParams = new NgTableParams({page: 1, sorting: {created: 'desc'}}, {
			getData: function (params) {
				self.loading = true;
				var page = params.page() - 1,
					limit = params.count(),
					resource = 'data.{model}@get'.format(self.tableObject)
				;
				var obj = {
					pageSize: limit,
					offset	: page * limit,
					where		: self.whereCondition
				};
				ng.forEach(params.sorting(), function (val, key) {
					obj.sortBy = key + ' ' + val;
				});
				if (!!self.tableRelations) {obj.loadRelations = self.tableRelations;}
				
				return self.TableService.getData(resource, obj).then(function (success) {
					params.total(success.totalObjects);
					self.index = obj.offset;
					self.tableData = success.data;
					self.loading = false;
					return self.tableData;
				}, function (error) {
					self.toastr.error(error.message, 'Error');
					self.message = error;
					self.loading = false;
				});
			}
		});
	};
	TableCtrl.$inject = ['TableObject', 'TableService', 'FormService', 'NgTableParams', '$uibModal', '$state', '$stateParams', 'toastr', 'FileSaver'];

	TableCtrl.prototype.init = function () {

	};

	TableCtrl.prototype.sortData = function (field) {
		var self = this;
		if (!!field.sort) {
			self.sort.name = field.model;
			self.sort.reversed = self.tableParams.isSortBy(field.sort, 'asc');
			self.tableParams.sorting(field.sort, (self.sort.reversed) ? 'desc' : 'asc');
		}
	};

	TableCtrl.prototype.searchReload = function () {
		var self = this;
		if (self.active === 'active') {
			self.whereCondition = 'deleted IS NULL';
		} else if (self.active === 'inactive') {
			self.whereCondition = 'deleted IS NOT NULL';
		}
		if (!!self.search.value) {
			var where = [];
			var obj = {val: self.search.value};
			ng.forEach(self.searchFields, function (val, key) {
				obj.key = key;
				where.push(self.searchConditions[val.cond].format(obj));
			});
			self.whereCondition += ' AND (' + where.join('OR ') + ')';
		}
		self.tableParams.reload();
	};

	TableCtrl.prototype.tableReload = function (tab) {
		var self = this;
		self.loading = true;
		self.active = tab.model;
		self.tab = tab;
		self.search.value = null;
		if (tab.model === 'active') {
			self.whereCondition = 'deleted IS NULL';
		} else if (tab.model === 'inactive') {
			self.tableData = [];
			self.whereCondition = 'deleted IS NOT NULL';
		}
		self.tableParams.reload();
	};

	TableCtrl.prototype.tableExport = function ($event) {
		var self = this, data = [], headers = [];
		// self.helper.csv.generate($event, 'report.csv');
		// location.href = self.helper.csv.link();
		// console.log('export:', self.helper);

		var tempData = [];
		ng.forEach(self.tableFields, function (val) {
			headers.push(val.model);
			tempData.push('"' + val.label + '"');
		});
		data.push(tempData);
		ng.forEach(self.tableData, function (val) {
			tempData = [];
			ng.forEach(self.tableFields, function (field) {
				if (!!val[field.model] && field.type === 'date') {
					tempData.push('"' + self.formatDate(field, val) + '"');
				} else if (!!val[field.model] && field.type === 'owner') {
					tempData.push('"' + self.showOwner(field, val) + '"');
				} else if (!!val[field.model]) {
					tempData.push('"' + self.showField(field, val) + '"');
				} else {
					tempData.push('');
				}
			});
			data.push('\n' + tempData);
		});

		var file = new Blob(data, {
			type: 'application/vnd.ms-excel;charset=charset=utf-8'
		});
		self.FileSaver.saveAs(file, self.title.toLowerCase().trim().underscore() + '.xls');
	};

	TableCtrl.prototype.onTableActionClicked = function (button, data) {
		var self = this;
		if (button.model === 'state' && !!button.state) {
			self.changePage(button.state, {title: data.code, data: data});
		} else if (button.model === 'resend_email') {
			self.loading = true;
			// console.log('createToken:', self.FormService.createToken(data));
			var res = 'data.member@put@{objectId}'.format(data);
			var obj = {activationToken: self.FormService.createToken(data)};
			self.FormService.save(res, obj).then(function (success) {
				return self.FormService.activationEmail(success);
			}).then(function () {
				self.toastr.success('Successfully resend email to {email}'.format(data));
				self.loading = false;
			}).catch(function (error) {
				self.toastr.error(error.message, 'Error');
				self.loading = false;
			});
		} else {
			self.showDialog(button.model || 'view', data);
		}
	};

	TableCtrl.prototype.changePage = function (sref, params) {
		var self = this;
		self.$state.go(sref, params || {});
	};

	TableCtrl.prototype.showField = function (col, row) {
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

	TableCtrl.prototype.showOwner = function (col, row) {
		var self = this,
			ownerVal = self.showField(col, row),
			owner = null
		;
		
		if (!!row.item) {
			if (ownerVal === 'ministry') {
				owner = row.item.ownerMinistry.name;
			} else if (ownerVal === 'member') {
				owner = row.item.ownerMember.name;
			}
		} else {
			if (ownerVal === 'ministry') {
				owner = row.ownerMinistry.name;
			} else if (ownerVal === 'member') {
				owner = row.ownerMember.name;
			}
		}
		return owner;
	};

	TableCtrl.prototype.showImage = function (col, row) {
		var self = this,
			image = self.showField(col, row),
			imageLink = 'images/no_image.png'
		;

		if (!!image) {imageLink = image;}
		return imageLink;
	};

	TableCtrl.prototype.formatDate = function (field, data) {
		var self = this;
		var date = self.showField(field, data);
		if (!date) {return '';}
		var today = new Date(date),
			dateFormat = {
				dd: today.getDate(),
				mm: today.getMonth(), // January is 0!
				yy: today.getFullYear() // YYYY
			},
			months = [
				'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
				'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
			]
		;
		
		dateFormat.dd = (dateFormat.dd < 10) ? '0{dd}'.format(dateFormat) : dateFormat.dd;

		today = months[dateFormat.mm] + ' {dd}, {yy}'.format(dateFormat);
		return !!date ? today : '';
	};

	TableCtrl.prototype.showDialog = function (action, data) {
		var self = this;
		var modalInstance = self.$uibModal.open({
			animation	 : true,
			templateUrl: 'views/app/_form_modal.html',
			controller : 'FormModalCtrl as ctrl',
			backdrop	 : 'static',
			keyboard	 : false,
			resolve		 : {
				tableData: function () { return self.tableObject;},
				action: function () { return action; },
				model: function () { return data; }
			}
		});
		modalInstance.result.then(function (data) {
			// console.log('show dialog:', data);
			self.tableParams.reload();
		});
	};

	// TableCtrl.prototype.showTableDialog = function (action) {
	// 	var self = this;
	// 	var modalInstance = self.$uibModal.open({
	// 		animation	 : true,
	// 		templateUrl: 'views/app/_table_modal.html',
	// 		controller : 'EventItemModalCtrl as ctrl',
	// 		backdrop	 : 'static',
	// 		size 			 : 'lg',
	// 		keyboard	 : false,
	// 		resolve		 : {
	// 			tableObject: function () { return self.tableObject;},
	// 			action: function () { return action; },
	// 			eventData: function () { return data }
	// 		}
	// 	});
	// 	modalInstance.result.then(function (data) {
	// 		console.log('show dialog:', data);
	// 		self.tableParams.reload();
	// 	});
	// };

	ng.module('equipmanApp')
		.controller('TableCtrl', TableCtrl)
	;
})(angular);