(function (ng) {
  'use strict';

  String.prototype.capitalize = function (lower) {
    return (lower ? this.toLowerCase() : this).replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
  };
  String.prototype.underscoreless = function () {
    return this.replace(/_/g, ' ');
  };
  String.prototype.underscore = function () {
    return this.replace(/ /g, '_');
  };
  String.prototype.pluralize = function (count, plural) {
    if (!plural) {plural = this + 's';}
    return (count === 1) ? this : plural;
  };
  String.prototype.format = function () {
    var str = this.toString();
    if (!arguments.length) {return str;}
    var args = typeof arguments[0];
    args = (('string' === args || 'number' === args) ? arguments : arguments[0]);
    for (var arg in args) {
      str = str.replace(new RegExp('\\{' + arg + '\\}', 'gi'), args[arg]);
    }
    return str;
  };
  String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
  };
  String.prototype.camelize = function() {
    var self = this;
    self = self.replace(/[\-_\s]+(.)?/g, function(match, chr) {
      return chr ? chr.toUpperCase() : '';
    });
    // Ensure 1st char is always lowercase
    return self.replace(/^([A-Z])/, function(match, chr) {
      return chr ? chr.toLowerCase() : '';
    });
  };

  var RunBlock, Config;

  RunBlock = function ($rootScope, $timeout, $state, $cookies, AuthenticateService, MainService) {
    // console.log('LocalStorage:', MainService.localStorage());
    if (!MainService.currentUser()) {
      AuthenticateService.logout().then(function () {
        $state.go('auth.login');
      });
    }
    var stateChangeStartEvent = $rootScope.$on('$stateChangeStart', function (event, toState) {
      var userToken = $cookies.get('user-token');
      var code = null;
      if (!!toState) {code = toState.name.split('.')[0];}
      if (code === 'auth' && !!userToken) {
        event.preventDefault();
        $state.go('app.home');
      }
      if (code === 'app' && !userToken) {
        event.preventDefault();
        $state.go('auth.login');
      }
      $rootScope.loadingProgress = true;
    });

    var stateChangeSuccessEvent = $rootScope.$on('$stateChangeSuccess', function () {
      $timeout(function () {
        $rootScope.loadingProgress = false;
      });
    });

    $rootScope.state = $state;
    $rootScope.$on('destroy', function () {
      stateChangeStartEvent();
      stateChangeSuccessEvent();
    });
  };
  RunBlock.$inject = ['$rootScope', '$timeout', '$state', '$cookies', 'AuthenticateService', 'MainService'];

  Config = function (BackendlessProvider, $locationProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
    // $locationProvider.html5Mode(true);

    // BackendlessProvider.applicationIdConfig('F9558935-8FED-0193-FF78-3EA9AA72CC00');
    // BackendlessProvider.secretKeyConfig('2141DDC5-DCE6-4947-FFE8-54681FCF9600');

    BackendlessProvider.keys.applicationId = 'CBAFBAC3-F0FF-D1CE-FF3B-7F60818CC000';
    BackendlessProvider.keys.secretKey = 'CE197249-ADE5-0C91-FF00-C8D8BA817800';

    $httpProvider.interceptors.push('HttpInterceptor');
    $httpProvider.defaults.headers.common['application-id'] = BackendlessProvider.keys.applicationId;
    $httpProvider.defaults.headers.common['secret-key'] = BackendlessProvider.keys.secretKey;
    $httpProvider.defaults.headers.common['application-type'] = BackendlessProvider.keys.applicationType;
    $httpProvider.defaults.headers.common['Content-Type'] = 'application/json';

    $urlRouterProvider.otherwise('home');
    $urlRouterProvider.when('/', ['$state', function ($state) { $state.go('app.home', {}); }]);
    $stateProvider
      .state('auth', {
        abstract: true,
        views   : {
          'main@': {
            templateUrl: 'views/core/_content-only.html',
            controller : 'MainCtrl as ctrl'
          }
        }
      })
      .state('error', {
        abstract: true,
        views   : {
          'main@': {
            templateUrl: 'views/core/_content-only.html',
            controller : 'MainCtrl as ctrl'
          }
        }
      })
      .state('app', {
        abstract: true,
        views   : {
          'main@': {
            templateUrl: 'views/core/_horizontal-navigation.html',
            controller : 'MainCtrl as ctrl'
          },
          'navigation@app': {
            templateUrl: 'views/navigation/_navigation.html',
            controller : 'NavigationCtrl as ctrl'
          }
        },
        resolve: {
          NavData: function (MainService) {
            return MainService.getData({name: 'navigation', group: 'navigation'});
          }
        }
      })
    ;
  };
  Config.$inject = ['BackendlessProvider', '$locationProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider'];

  ng.module('equipmanApp')
    .run(RunBlock)
    .config(Config)
  ;
})(angular);