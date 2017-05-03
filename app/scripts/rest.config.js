(function (ng) {
	'use strict';
	
	var Config = function (BackendlessProvider) {
		
		BackendlessProvider.register('send.email', 'messaging/email');
		BackendlessProvider.register('auth.register', 'users/register');
		BackendlessProvider.register('auth.login', 'users/login');
		BackendlessProvider.register('auth.logout', 'users/logout');
		BackendlessProvider.register('data.role', 'data/Roles');
		BackendlessProvider.register('data.user', 'data/Users');
		BackendlessProvider.register('data.member', 'data/Members');
		BackendlessProvider.register('data.ministry', 'data/Ministries');
		BackendlessProvider.register('data.item', 'data/Items');
		BackendlessProvider.register('data.event', 'data/Events');

		BackendlessProvider.register('data.item_owner', 'data/ItemOwners');
		BackendlessProvider.register('data.item_holder', 'data/ItemHolders');

		BackendlessProvider.register('data.event_item', 'data/EventItems');

		BackendlessProvider.register('file.image', 'files/binary/images');

		BackendlessProvider.register('bulk.item', 'data/bulk/Items');
	};
	Config.$inject = ['BackendlessProvider'];

	ng.module('app.rest', [])
		.config(Config)
	;

})(angular);