(function (ng) {
  'use strict';

  var HttpInterceptor = function ($rootScope, $q, $window, $cookies, $localStorage) {
    return {
      response: function (response) {
        switch (response.status) {
          case 500:
            break;
          case 400:
            break;
          case 401:
            break;
          case 404:
            break;
        }
        return response || $q.when(response);
      },
      responseError: function (rejection) {
        switch (rejection.status) {
          case 500:
            break;
          case 400:
            if (!!rejection.data && !!rejection.data.code) {
              switch (rejection.data.code) {
                case 3064:
                  rejection.data.message = 'Invalid user token. Please Relogin to update the user token';
                  $cookies.remove('user-token');
                  $localStorage.$reset();
                  $window.location.href = '/#/login';
                  break;
                case 8023:
                  rejection.data.message = 'Password must be atleast 8 characters long';
                  break;
              }
            }
            break;
          case 401:
            break;
          case 404:
            break;
        }
        return $q.reject(rejection);
      }
    };
  };
  HttpInterceptor.$inject = ['$rootScope', '$q', '$window', '$cookies', '$localStorage'];

  

  ng.module('app.http-interceptor', [])
    .service('HttpInterceptor', HttpInterceptor)
  ;
})(angular);