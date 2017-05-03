(function (ng) {
	'use strict';

	var RunBlock, Config;

	RunBlock = function () {
		
	};
	RunBlock.$inject = [];

	Config = function (formlyConfigProvider, pikadayConfigProvider) {
		pikadayConfigProvider.setConfig({
      format: 'MMM DD, YYYY'
    });

		formlyConfigProvider.setWrapper({
			name: 'formContainer',
			template: [
				'<div class="form-group"><formly-transclude></formly-transclude></div>'
			].join(' ')
		});

		formlyConfigProvider.setWrapper({
			name: 'labelSrOnly',
			template: [
				'<label for="{{::id}}" class="sr-only control-label">{{to.label}}</label>',
				'<formly-transclude></formly-transclude>'
			].join(' ')
		});

		formlyConfigProvider.setWrapper({
			name: 'horizontalLabel',
			template: [
				'<label for="{{::id}}" class="col-sm-4 col-md-4 control-label">{{to.label}}</label>',
				'<div class="col-sm-8 col-md-8"><formly-transclude></formly-transclude></div>'
			].join(' ')
		});

		formlyConfigProvider.setWrapper({
			name: 'horizontalLabelLess',
			template: [
				'<label for="{{::id}}" class="col-sm-3 col-md-3 control-label">{{to.label}}</label>',
				'<div class="col-sm-9 col-md-9"><formly-transclude></formly-transclude></div>'
			].join(' ')
		});

		formlyConfigProvider.setWrapper({
			name: 'horizontalCheckbox',
			template: [
				'<div ng-class="{\'p-0\': !!to.noPadding}"><formly-transclude></formly-transclude></div>'
			].join(' ')
		});

		formlyConfigProvider.setType({
			name: 'input-login',
			template: [
				'<div>',
					'<input class="form-control input-lg" ng-disabled="(formState.readOnly || to.disabled)" ng-model="model[options.key]" placeholder="{{to.label || to.placeholder}}"">',
				'</div>'
			].join(' '),
			wrapper: ['labelSrOnly', 'formContainer']
		});

		formlyConfigProvider.setType({
			name: 'input-horizontal',
			template: [
				'<div>',
					'<div ng-if="!formState.readOnly" class="has-feedback">',
						'<input class="form-control" ng-disabled="(formState.readOnly || to.disabled)" ng-model="model[options.key]" placeholder="{{to.label || to.placeholder}}">',
					'</div>',
					'<p ng-if="formState.readOnly" class="form-control-static">{{model[options.key]}}</p>',
				'</div>'
			].join(' '),
			wrapper: ['horizontalLabel', 'formContainer']
		});

		formlyConfigProvider.setType({
			name: 'input-horizontal-less',
			template: [
				'<div>',
					'<div ng-if="!formState.readOnly" class="has-feedback">',
						'<input class="form-control" ng-disabled="(formState.readOnly || to.disabled)" ng-model="model[options.key]" placeholder="{{to.label || to.placeholder}}">',
					'</div>',
					'<p ng-if="formState.readOnly" class="form-control-static">{{model[options.key]}}</p>',
				'</div>'
			].join(' '),
			wrapper: ['horizontalLabelLess', 'formContainer']
		});

		formlyConfigProvider.setType({
			name: 'textarea-horizontal',
			extends: 'textarea',
			template: [
				'<div>',
					'<textarea ng-if="!formState.readOnly" class="form-control"',
										'placeholder="{{to.placeholder || to.label}}"',
										'ng-model="model[options.key]">',
					'</textarea>',
					'<p ng-if="formState.readOnly" class="form-control-static">{{model[options.key]}}</p>',
				'</div>'
			].join(' '),
			wrapper: ['horizontalLabel', 'formContainer']
		});
    
    formlyConfigProvider.setType({
      name: 'select-horizontal',
      template: [
      	'<div>',
      		'<span ng-if="loading" class="btn btn-block btn-default" disabled="true"><i class="fa fa-spinner fa-pulse"></i> &nbsp Loading {{to.label}}</span>',
	      	'<ol ng-if="!formState.readOnly && !loading" class="nya-bs-select form-control"',
	      			// 'ng-disabled="(formState.readOnly || to.disabled || to.options.length < 0)"',
	      			'ng-model="model[options.key]">',
	      		'<li nya-bs-option="option in to.options" data-value="option[to.valueProp] || option.value || \'value\'">',
	      			'<a>',
	      				'<span>{{option[to.labelProp] || option.name || \'name\'}}</span>',
	      				'<span class="fa fa-check check-mark"></span>',
	      			'</a>',
	      		'</li>',
	      	'</ol>',
	      	'<p ng-if="formState.readOnly" class="form-control-static">{{model[options.key][to.dataDisplay || \'name\'] || model[options.key]}}</p>',
      	'</div>',
      ].join(' '),
      wrapper: ['horizontalLabel', 'formContainer'],
      defaultOptions: {
      	ngModelAttrs: {
      		'multiple': {attribute: 'multiple'},
      		'liveSearch': {attribute: 'data-live-search'},
      		'dataSize': {attribute: 'data-size'},
      		'title': {attribute: 'title'},
      		'{{to.liveSearch || false}}': {value: 'data-live-search'},
      		'{{to.dataSize || 5}}': {value: 'data-size'},
      		'{{to.label || to.title}}': {value: 'title'}
      	}
      },
      apiCheck: function (check) {
      	return {
	      	templateOptions: {
	      		'data-live-search': check.bool.optional,
	      		'data-size': check.number.optional,
	      		'title': check.string.optional
	      	}
      	};
      },
      controller: ['Backendless', '$scope', function (Backendless, $scope) {
      	$scope.loading = false;
      	$scope.getOptions = function () {
      		$scope.loading = true;
      		var op = $scope.to.optionProperties;
      		$scope.to.options = [];
      		// console.log('resource:', op.resource);
      		Backendless.request(op.resource + '@get', op.conditions || {}).then(
      			function (success) {
      				// console.log('Select model:', $scope.model[$scope.options.key]);
      				// console.log('Select success:', success);
      				ng.forEach(success.data, function (val) {
      					var model = $scope.model[$scope.options.key];
      					$scope.to.options.push({name: val.name, value: val});
      					if (!!val.__meta) {delete val.__meta;}
      					if (!!val.objectId && !!model) {
      						if (model.objectId === val.objectId) {
	      						$scope.model[$scope.options.key] = val;
      						}
      					}
      				});
      				$scope.loading = false;
      			},
      			function (error) {
      				// console.log('Select error:', error);
      				$scope.loading = false;
      			}
      		);
      	};

      	if (!$scope.formState.readOnly && !!$scope.to.optionProperties) {
      		$scope.getOptions();
      	}
      }]
    });

    formlyConfigProvider.setType({
    	name: 'datepicker',
    	template: [
    		'<input ng-if="!formState.readOnly" pikaday="datePikaday" on-open="setDates(pikaday, to)"',
    			'class="form-control" default-date="{{formatDate(model[options.key])}}" set-default-date="true"',
    			'placeholder="{{to.placeholder || to.label}}"',
    			'ng-model="model[options.key]"',
    			'ng-disabled="(formState.readOnly || to.disabled)">',
    		'<p ng-if="formState.readOnly" class="form-control-static">{{formatDate(model[options.key])}}</p>',
    	].join(' '),
      wrapper: ['horizontalLabel', 'formContainer'],
      controller: ['$scope', function ($scope) {
      	$scope.setDates = function (pikaday, to) {
      		// console.log('minDate', to.minDate);
					if (!!to.minDate || to.minDate === 0) {
						var today = new Date();
						var minDate = today.setDate(today.getDate());
						if (to.minDate > 0) {minDate = today.setDate(today.getDate() - to.minDate);}
						pikaday.setMinDate(new Date(minDate));
					}

					if (!!to.maxDate || to.maxDate === 0) {
						var today1 = new Date();
						var maxDate = today1.setDate(today1.getDate());
						if (to.maxDate > 0) {maxDate = today1.setDate(today1.getDate() + to.maxDate);}
						pikaday.setMaxDate(new Date(maxDate));
					}
      	};

      	$scope.formatDate = function(date) {
      		var today = new Date();
      		if (!!date) {
      			today = new Date(date);
      		}
					var dateFormat = {
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
					return today;
      	};
      }]
    });

		formlyConfigProvider.setType({
			name: 'image-base64-horizontal',
			template: [
				// New
				'<div class="input-group" ng-if="formState.action === \'add\'">',
					'<span class="input-group-btn">',
						'<span class="btn btn-default btn-file">Browse &hellip;',
							'<input type="file" ng-model="model[options.key]" accept="image/*" base-sixty-four-input="base-sixty-four-input">',
						'</span>',
					'</span>',
					'<div class="has-feedback has-clear">',
						'<input type="text" class="form-control" placeholder="{{to.placeholder || to.label}}" value="{{model[options.key].filename}}" readonly>',
						'<button type="button" class="btn btn-link form-control-clear fa fa-close form-control-feedback" ng-click="clear()" ng-class="{\'hidden\': !model[options.key]}" ng-disabled="(formState.readOnly || to.disabled)"></button>',
					'</div>',
				'</div>',
				// Edit
				'<div ng-if="formState.action === \'edit\'">',
					'<div ng-if="isImage && !!image">',
						'<button type="button" class="btn btn-default col-xs-12" ng-click="change()">Change</button>',
						'<img ng-src="{{image}}" height="100%" width="75%" class="img-thumbnail col-xs-12">',
					'</div>',
					'<div class="input-group" ng-if="!isImage || !image">',
						'<span class="input-group-btn">',
							'<span class="btn btn-default btn-file">Browse &hellip;',
								'<input type="file" ng-model="model[options.key]" accept="image/*" base-sixty-four-input="base-sixty-four-input">',
							'</span>',
						'</span>',
						'<div class="has-feedback has-clear">',
							'<input type="text" class="form-control" placeholder="{{to.placeholder || to.label}}" value="{{model[options.key].filename}}" readonly>',
							'<button type="button" class="btn btn-link form-control-clear fa fa-close form-control-feedback" ng-click="clear()" ng-class="{\'hidden\': !model[options.key]}" ng-disabled="(formState.readOnly || to.disabled)"></button>',
						'</div>',
						'<span class="input-group-btn">',
							'<button type="button" class="btn btn btn-default" ng-click="change()">Cancel</button>',
						'</span>',
					'</div>',
				'</div>',
				// View
				'<div ng-if="formState.readOnly">',
					'<img ng-if="!!model[options.key]" ng-src="{{model[options.key]}}" height="auto" width="75%" class="img-thumbnail">',
					'<p ng-if="!model[options.key]" class="form-control-static">No Image</p>',
				'</div>'
			].join(' '),
			wrapper: ['horizontalLabel', 'formContainer'],
			controller: ['$scope', function ($scope) {
				$scope.image = $scope.model[$scope.options.key]; // || 'images/no_image.png';
				$scope.isImage = true;
				$scope.clear = function () {
					$scope.model[$scope.options.key] = null;
				};
				$scope.change = function () {
					$scope.isImage = !$scope.isImage;
					$scope.clear();
				};
			}]
		});

		// formlyConfigProvider.setType({
		// 	name: 'checkbox-horizontal',
		// 	extends: 'checkbox',
		// 	wrapper: ['horizontalCheckbox', 'formContainer']
		// });

		formlyConfigProvider.setType({
			name: 'checkbox-horizontal',
			template: [
				'<checkbox ng-model="model[options.key]" name="{{to.label}}"></checkbox>',
				'<span class="ml-8" style="vertical-align: middle; cursor: default;">',
					'{{to.label}}',
				'</span>'
			].join(' '),
			wrapper: ['horizontalCheckbox', 'formContainer']
		});

	};
	Config.$inject = ['formlyConfigProvider', 'pikadayConfigProvider'];

	ng.module('em-formly', ['formly', 'formlyBootstrap', 'pikaday', 'nya.bootstrap.select', 'naif.base64', 'ui.checkbox'])
		.run(RunBlock)
		.config(Config)
	;
})(angular);