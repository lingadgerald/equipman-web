(function (ng) {
  'use strict';

  var MainCtrl = function ($scope) {
    // console.log('MainCtrl');
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  };
  MainCtrl.$inject = ['$scope'];

  ng.module('equipmanApp')
    .controller('MainCtrl', MainCtrl);
})(angular);