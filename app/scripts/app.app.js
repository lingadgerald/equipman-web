(function (ng) {
  'use strict';

  ng.module('equipmanApp', [
    'app.http-interceptor',
    'app.core',
    'app.backendless',
    'app.rest',

    'em-formly',

    'app.auth',
    'app.home',
    'app.profile',
    'app.user',
    'app.ministry',
    'app.item',
    'app.event'
  ]);
})(angular);