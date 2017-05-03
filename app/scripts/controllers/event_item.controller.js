(function (ng) {
	'use strict';

	var EventItemCtrl = function (TableObject, TableService, NgTableParams, $uibModal, $state, $stateParams, toastr) {
		var self = this, tableObject = TableObject;
		
		self.TableService = TableService;
		self.NgTableParams = NgTableParams;
		self.$uibModal = $uibModal;
		self.$state = $state;
		self.$stateParams = $stateParams;
		self.toastr = toastr;

		self.tableObject = tableObject;
		self.tabs = tableObject.tabs;
		self.tab = self.tabs[0];
		self.tabData = tableObject.tabData[self.tab.model];
		
		self.name = self.tabData.name;
		self.heading = (self.tabData.heading || $stateParams.title || '').underscoreless();
		self.title = self.tabData.title;
		self.backButton = self.tabData.backButton;
		self.icon = self.tabData.icon;
		self.tableFields = self.tabData.tableFields;
		self.formFields = self.tabData.formFields;
		self.searchFields = self.tabData.searchFields;
		self.tableRelations = self.tabData.tableRelations;

		self.tableData = [];
		self.eventData = {};
		self.active = self.tab.model || 'active';
		self.message = null;
		self.loading = false;
		self.expired = false;
		self.conditions = {};

		self.whereCondition = 'deleted IS NULL and code = \'{title}\''.format($stateParams);

		self.search = {};
		self.searchConditions = TableService.searchConditions;
		self.sort = {name: 'created', reversed: true};

		self.helper = {csv: null};

		self.init();
		self.tableParams = new NgTableParams({}, {
			dataset: self.tableData
		});
	};
	EventItemCtrl.$inject = ['TableObject', 'TableService', 'NgTableParams', '$uibModal', '$state', '$stateParams', 'toastr'];

	EventItemCtrl.prototype.init = function () {
		var self = this;
		self.getData();
	};

	EventItemCtrl.prototype.getData = function () {
		var self = this,
			resource = 'data.{model}@get'.format(self.tabData),
			obj = {where: self.whereCondition}
		;
		self.loading = true;
		if (!!self.tableRelations) {obj.loadRelations = self.tableRelations;}
		self.TableService.getData(resource, obj).then(function (success) {
			self.eventData = success.data[0];
			self.expired = new Date() >= self.eventData.eventDate;
			self.tableData.splice(0, self.tableData.length);
			var temp = self.eventData.items;
			if (self.name === 'event_attendance') {temp = self.eventData.attendance;}
			ng.forEach(temp, function (val) {
				self.tableData.push(val);
			});
			self.search.query = null;
			self.loading = false;
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.message = error;
			self.loading = false;
		});
	};

	EventItemCtrl.prototype.sortData = function (field) {
		var self = this;
		if (!!field.sort) {
			self.sort.name = field.model;
			self.sort.reversed = !self.sort.reversed;
		}
	};

	EventItemCtrl.prototype.searchReload = function () {
		var self = this;
		self.search.query = self.search.value;
	};

	EventItemCtrl.prototype.tableReload = function (tab) {
		var self = this;
		self.loading = true;
		self.active = tab.model;
		self.tab = tab;
		self.search.value = null;
		self.tabData = self.tableObject.tabData[tab.model];

		if ((tab.model === 'items' && self.name !== 'event_item') ||
				(tab.model === 'attendance' && self.name !== 'event_attendance')) {
			self.tableData.splice(0, self.tableData.length);
		}

		self.name = self.tabData.name;
		self.title = self.tabData.title;
		self.backButton = self.tabData.backButton;
		self.icon = self.tabData.icon;
		self.tableFields = self.tabData.tableFields;
		self.formFields = self.tabData.formFields;
		self.searchFields = self.tabData.searchFields;
		self.tableRelations = self.tabData.tableRelations;

		self.getData();
		// self.tableParams.reload();
	};

	EventItemCtrl.prototype.tableExport = function ($event) {
		var self = this;
		self.helper.csv.generate($event, 'report.csv');
		location.href = self.helper.csv.link();
		// console.log('export:', self.helper);
	};

	EventItemCtrl.prototype.onTableActionClicked = function (button, data) {
		var self = this;
		if (button.model === 'state' && !!button.state) {
			self.changePage(button.state, {title: data.code, data: data});
		} else {
			self.showDialog(button.model || 'view', data);
		}
	};

	EventItemCtrl.prototype.changePage = function (sref, params) {
		var self = this;
		self.$state.go(sref, params || {});
	};

	EventItemCtrl.prototype.showField = function (col, row) {
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

	EventItemCtrl.prototype.showOwner = function (col, row) {
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

	EventItemCtrl.prototype.showLog = function (col, row) {
		var self = this,
			data = ng.copy(row),
			logs = data.logs,
			model = null
		;
		var log = logs.find(function (x) {return x.event === self.$stateParams.title;}) || {};
		if (!ng.equals({}, log)) {model = log[col.view];}
		return model;
	};

	EventItemCtrl.prototype.showImage = function (col, row) {
		var self = this,
			image = self.showField(col, row),
			imageLink = 'images/no_image.png'
		;

		if (!!image) {imageLink = image;}
		return imageLink;
	};

	EventItemCtrl.prototype.showDialog = function (action, data) {
		var self = this;
		var modalInstance = self.$uibModal.open({
			animation	 : true,
			templateUrl: 'views/app/_form_modal.html',
			controller : 'FormModalCtrl as ctrl',
			backdrop	 : 'static',
			keyboard	 : false,
			resolve		 : {
				tableData: function () { return self.tabData; },
				action: function () { return action; },
				model: function () { return data; }
			}
		});
		modalInstance.result.then(function (data) {
			// console.log('show dialog:', data);
			self.tableParams.reload();
		});
	};

	EventItemCtrl.prototype.showTableDialog = function (action) {
		var self = this;
		var modalInstance = self.$uibModal.open({
			animation	 : true,
			templateUrl: 'views/app/_table_modal.html',
			controller : 'EventItemModalCtrl as ctrl',
			backdrop	 : 'static',
			size 			 : 'lg',
			keyboard	 : false,
			resolve		 : {
				tableObject: function () { return self.tabData; },
				action: function () { return action; },
				eventData: function () { return self.eventData; }
			}
		});
		modalInstance.result.then(function (data) {
			// console.log('show dialog:', data);
			self.getData();
		});
	};

	EventItemCtrl.prototype.formatDate = function (field, data) {
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

	ng.module('equipmanApp')
		.controller('EventItemCtrl', EventItemCtrl)
	;
})(angular);