'use strict';

angular.module('mean.playyou').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('playyou example page', {
      url: '/playyou/example',
      templateUrl: 'playyou/views/index.html'
    });
  }
]);

angular.module('mean.playyou')
.config(['$viewPathProvider', function($viewPathProvider) {
	$viewPathProvider.override('system/views/index.html', 'playyou/views/index.html');
}]);