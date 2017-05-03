(function (ng) {
	'use strict';

	var EventItemModalCtrl = function (tableObject, action, eventData, $uibModalInstance, NgTableParams, TableService, FormService, toastr, $scope) {
		var self = this;

		self.$uibModalInstance = $uibModalInstance;
		self.TableService = TableService;
		self.FormService = FormService;
		self.toastr = toastr;

		self.tableObject = tableObject;
		self.action = action;
		self.eventData = ng.copy(eventData);
		self.model = ng.copy(eventData);
		self.eventItems = ng.copy(eventData.items) || [];
		self.fields = tableObject.formFields;
		self.tableFields = tableObject.modalTableFields;
		self.requiredFields = tableObject.requiredFields;
		self.searchFields = tableObject.modalSearchFields;
		self.tableRelations = tableObject.modalTableRelations;
		self.icon = 'fa-plus';

		self.index = 0;
		self.tableData = [];
		self.item = {selected: false};
		self.message = null;
		self.loading = false;
		self.conditions = {};
		// self.whereCondition = 'event IS NULL AND deleted IS NULL';
		self.whereCondition = 'deleted IS NULL';

		self.search = {};
		self.searchConditions = TableService.searchConditions;
		self.sort = {name: 'created', reversed: false};

    self.selected = {checked: false, items: {}, total: 0};

		self.tableParams = new NgTableParams({page: 1, sorting: {created: 'desc'}}, {
			getData: function (params) {
				var page = params.page() - 1,
					limit = params.count(),
					resource = 'data.{modalModel}@get'.format(self.tableObject)
				;
				self.loading = true;
				var obj = {
					pageSize: limit,
					offset	: page * limit,
					where 	: self.whereCondition
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
					self.message = error;
					self.loading = false;
				});
			}
		});

		ng.forEach(self.eventItems, function (item) {
			self.selected.items[item.objectId] = true;
		});

    // watch for check all checkbox
    $scope.$watch(function () {
      return self.selected.checked;
    }, function (value) {
      ng.forEach(self.tableData, function (item) {
        self.selected.items[item.objectId] = value;
      });
    });
    
    // watch for data checkboxes
    $scope.$watch(function () {
      return self.selected.items;
    }, function () { //(values) {
      var checked = 0, unchecked = 0, total = self.tableData.length;
      ng.forEach(self.tableData, function (item) {
        checked   +=  (self.selected.items[item.objectId]) || 0;
        unchecked += (!self.selected.items[item.objectId]) || 0;
      });
      if ((unchecked === 0) || (checked === 0)) {
        self.selected.checked = (checked === total);
      }
      self.selected.total = checked;
    }, true);

	};
	EventItemModalCtrl.$inject = ['tableObject', 'action', 'eventData', '$uibModalInstance', 'NgTableParams', 'TableService', 'FormService', 'toastr', '$scope'];

	EventItemModalCtrl.prototype.ok = function (data) {
		var self = this;
		self.$uibModalInstance.close(data);
	};

	EventItemModalCtrl.prototype.cancel = function () {
		var self = this;
		self.$uibModalInstance.dismiss('Cancelled');
	};

	EventItemModalCtrl.prototype.sortData = function (field) {
		var self = this;
		if (!!field.sort) {
			self.sort.name = field.model;
			self.sort.reversed = self.tableParams.isSortBy(field.sort, 'asc');
			self.tableParams.sorting(field.sort, (self.sort.reversed) ? 'desc' : 'asc');
		}
	};

	EventItemModalCtrl.prototype.searchReload = function () {
		var self = this;
		// self.whereCondition = 'event IS NULL AND deleted IS NULL';
		self.whereCondition = 'deleted IS NULL';
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

	EventItemModalCtrl.prototype.tableReload = function () {
		var self = this;
		self.loading = true;
		self.search.value = null;
		self.whereCondition = 'deleted IS NULL';
		self.tableParams.reload();
	};

	EventItemModalCtrl.prototype.save = function () {
		var self = this,
			// eventData = {___class: 'Events', objectId: self.eventData.objectId},
			selected = ng.copy(self.selected),
			resource = 'data.event@put',
			ids = [],
			// itemResource = 'bulk.item@put',
			itemSave = [],
			itemDel = [],
			itemDelTemp = ng.copy(self.eventItems)
		;
		self.loading = true;
		// console.log('item selected:', selected);
		ng.forEach(selected.items, function (val, key) {
			if (!!val) {
				ids.push({'___class': 'Items', objectId: key});
				itemSave.push(key);
				var oId = itemDelTemp.find(function (val) {
					return val.objectId === key;
				});
				if (!!oId) {itemDelTemp.splice(itemDelTemp.indexOf(oId), 1);}
			}
		});
		ng.forEach(itemDelTemp, function (val) {
			itemDel.push(val.objectId);
		});
		self.model.items = ng.copy(ids);
		self.FormService.save(resource, self.model).then(function (success) {
			// var itemSaveRes = itemResource + '@objectId IN (\'' + itemSave.join('\',\'') + '\')';
			// var itemDelRes = itemResource + '@objectId IN (\'' + itemDel.join('\',\'') + '\')';
			// if (itemSave.length === 0 && itemDel.length > 0) {
			// 	self.FormService.bulkSave(itemDelRes, {event: null, isUsed: false}).then(function (success) {
			// 		self.ok(success);
			// 	}, function (error) {
			// 		self.toastr.error(error.message, 'Error');
			// 		self.loading = false;
			// 	});
			// } else if (itemSave.length > 0 && itemDel.length === 0) {
			// 	self.FormService.bulkSave(itemSaveRes, {event: eventData, isUsed: true}).then(function (success) {
			// 		self.ok(success);
			// 	}, function (error) {
			// 		self.toastr.error(error.message, 'Error');
			// 		self.loading = false;
			// 	});
			// } else if (itemSave.length > 0 && itemDel.length > 0) {
			// 	self.FormService.bulkSave(itemSaveRes, {event: eventData, isUsed: true}).then(function (success) {
			// 		return self.FormService.bulkSave(itemDelRes, {event: null, isUsed: false});
			// 	}).then(function (success) {
			// 		self.ok(success);
			// 	}).catch(function (error) {
			// 		self.toastr.error(error.message, 'Error');
			// 		self.loading = false;
			// 	});
			// } else {
			// 	self.ok(success);
			// }
			self.ok(success);
		}, function (error) {
			self.toastr.error(error.message, 'Error');
			self.loading = false;
		});
	};

	EventItemModalCtrl.prototype.showField = function (col, row) {
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

	EventItemModalCtrl.prototype.showOwner = function (col, row) {
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

	EventItemModalCtrl.prototype.showImage = function (col, row) {
		var self = this,
			image = self.showField(col, row),
			imageLink = 'images/no_image.png'
		;
		if (!!image) {imageLink = image;}
		return imageLink;
	};

	EventItemModalCtrl.prototype.formatDate = function (field, data) {
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
		.controller('EventItemModalCtrl', EventItemModalCtrl)
	;
})(angular);