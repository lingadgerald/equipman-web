(function (ng) {
  'use strict';

  var Backendless = function () {
    var self = this,
      $log = ng.injector(['ng']).get('$log'),
      paths = {},
      keys = {
        applicationId  : '<application-id>',
        secretKey      : '<secret-key>',
        version        : 'v1',
        applicationType: 'REST',
        apiUrl         : 'https://api.backendless.com',
        path           : 'files/web/equipman/index.html'
      }
    ;

    // A helper function to define our configure functions.
    // Loops over all properties in obj, and creates a get/set
    // method for [key + suffix] to set that property on obj.
    
    // function configure(obj, suffix) {
    //   ng.forEach(obj, function(v, action) {
    //     this[action + suffix] = function(param) {
    //       if (param === undefined) {
    //         return obj[action];
    //       }
    //       obj[action] = param;
    //       return this;
    //     };
    //   }, this);
    // }
    // configure.call(this, keys, 'Config');

    function register(key, path) {
      if (!ng.isString(key)) {
        $log.error('"path" must be a string (eg. `dashboard.project`)');
        return;
      }

      if (!ng.isString(path)) {
        $log.error('"path" must be a string (eg. `users/register`)');
        return;
      }

      paths[key] = path;
    }

    self.register = register;
    self.keys = keys;

    self.$get = ['$q', '$log', '$http', '$cookies', function ($q, $log, $http, $cookies) {
      function request(action, data, headerRequests) {
        var actionParts = action.split('@'),
          resource = actionParts[0],
          method = actionParts[1],
          object = actionParts[2],
          params = data || {},
          headers = headerRequests || {}
        ;

        if (!resource || !method) {
          $log.error('backendless.request requires correct action parameter (resourceName@methodName)');
          return false;
        } else {
          method = method.toUpperCase();
        }

        var deferred = $q.defer(),
          promise = deferred.promise,
          pathObject = paths[resource]
        ;

        if (!pathObject) {
          $log.error('Resource "' + resource + '" is not defined in the api service!');
          deferred.reject('Resource "' + resource + '" is not defined in the api service!');
        } else {
          var obj = ng.copy(keys);
          var userToken = $cookies.get('user-token');
          var url = ['{apiUrl}/{version}/{path}'];

          if (!!object) {url.push('/{param}');}

          obj.path = paths[resource];
          obj.param = object;

          var httpConfig = {
            method: method,
            url: url.join('').format(obj),
            headers: headers
          };

          if (method === 'GET') {
            httpConfig.params = params;
          } else {
            httpConfig.data = params;
          }

          if (!!userToken) {httpConfig.headers['user-token'] = userToken;}

          // console.log(httpConfig);
          $http(httpConfig).then(function successCallback(response) {
            deferred.resolve(response.data);
          }, function errorCallback(response) {
            deferred.reject(response.data);
          });

          return promise;
        }
      }

      function bulkRequest(action, data, headerRequests) {
        var actionParts = action.split('@'),
          resource = actionParts[0],
          method = actionParts[1],
          object = actionParts[2],
          params = data || {},
          headers = headerRequests || {}
        ;

        if (!resource || !method) {
          $log.error('backendless.bulkRequest requires correct action parameter (resourceName@methodName)');
          return false;
        } else {
          method = method.toUpperCase();
        }

        if (method === 'GET' || method === 'POST') {
          $log.error('backendless.bulkRequest doesn\'t support GET and POST method');
          return false;
        }

        var deferred = $q.defer(),
          promise = deferred.promise,
          pathObject = paths[resource]
        ;

        if (!pathObject) {
          $log.error('Resource "' + resource + '" is not defined in the api service!');
          deferred.reject('Resource "' + resource + '" is not defined in the api service!');
        } else {
          var obj = ng.copy(keys);
          var userToken = $cookies.get('user-token');
          var url = ['{apiUrl}/{version}/{path}'];

          if (!!object) {url.push('?where={param}');}

          obj.path = paths[resource];
          obj.param = object;

          var httpConfig = {
            method: method,
            url: url.join('').format(obj),
            headers: headers
          };

          if (method === 'GET') {
            httpConfig.params = params;
          } else {
            httpConfig.data = params;
          }

          if (!!userToken) {httpConfig.headers['user-token'] = userToken;}

          // console.log(httpConfig);
          $http(httpConfig).then(function successCallback(response) {
            deferred.resolve(response.data);
          }, function errorCallback(response) {
            deferred.reject(response.data);
          });

          return promise;
        }
      }

      function deleteImage(imageUrl, headerRequests) {
        var deferred = $q.defer(),
          promise = deferred.promise,
          userToken = $cookies.get('user-token'),
          headers = headerRequests || {},
          method = 'DELETE'
        ;

        if (!imageUrl) {
          $log.error('backendless.deleteImage requires correct image url');
          return false;
        }
        var httpConfig = {
          method : method,
          url    : imageUrl,
          headers: headers || {}
        };
        if (!!userToken) {httpConfig.headers['user-token'] = userToken;}
        $http(httpConfig).then(function successCallback(response) {
          deferred.resolve(response.data);
        }, function errorCallback(response) {
          deferred.reject(response.data);
        });

        return promise;
      }

      function activationEmail(subject, bodyparts, to, attatchment) {
        var deferred = $q.defer(),
          promise = deferred.promise
        ;
        subject = subject || 'Equipman';
        if (!ng.isArray(to)) {
          $log.error('backendless.sendEmail must have an array of email addresses to deliver the email message');
          return false;
        }
        if (ng.isObject(bodyparts) && !ng.isArray(bodyparts)) {
          if (!bodyparts.textmessage && !bodyparts.htmlmessage) {
            $log.error('backendless.sendEmail must have a textmessage or htmlmessage key to create the body of the email message');
            return false;
          }
        }

        var obj = {
          subject  : subject,
          to       : to,
          bodyparts: bodyparts
        };

        if (!!attatchment) {obj.attatchment = attatchment;}

        request('send.email@post', obj).then(function (success) {
          // console.log('send email success:', success);
          deferred.resolve(success);
        }, function (error) {
          // console.log('send email error:', error);
          deferred.reject(error);
        });
        return promise;
      }

      var service = {
        keys            : self.keys,
        paths           : paths,
        register        : register,
        request         : request,
        bulkRequest     : bulkRequest,
        deleteImage     : deleteImage,
        activationEmail : activationEmail
      };
      return service;
    }];
  };
  Backendless.$inject = [];

  ng.module('app.backendless', [])
    .provider('Backendless', Backendless)
  ;
})(angular);