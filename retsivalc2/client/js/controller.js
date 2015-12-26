
theModule.controller('mainCtrl', [
  '$scope', '$timeout', 'prioList', '$uibModal', 
  ($scope, $timeout, prioList, $uibModal) => {

  function init(){
    window.s = $scope; // for Debug, REMOVE it.
    s.updateUI = updateUI;
    $scope.alerts = [];   
    $scope.prioList = prioList;
    $scope.query = new Query();
    $scope.sources = new LogSources();
    $scope.sources.addObserver(onLogSourcesChange);
    $scope.data = [];
    for(let i=0;i<100;i++){
      $scope.data.push({
        name: 'name_' + Math.round(Math.random()*1000),
        age: Math.round(Math.random()*100)
      });
    }
  }

  function onLogSourcesChange({missing, added}){
    console.log('log sources updated: ', missing, added);
  }

  $scope.addAlert = (msg, type) => $scope.alerts.push({msg, type});
  $scope.closeAlert = index => $scope.alerts.splice(index, 1);
  $scope.clearAlerts = () => $scope.alerts = [];
  $scope.resetQuery = () => {
    $scope.query = new Query();
    angular.element('.date input').each((index, element) => element.data('DateTimePicker').date(null));   // for resetting all the Date Fields
  };
  $scope.updateUI = updateUI;

  $scope.editLogSources = () => {

    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      templateUrl: `${partialsSourceDir}logSourcesModal.html`,
      controller: 'logSourcesModal',
      resolve: {
        sources: () => $scope.sources.list()
      }
    });

    modalInstance.result.then( newSources => $scope.sources.updateSources(newSources), () => {});
  }



  // For triggering DOM update.
  function updateUI(){ 
    var phase = $scope.$root.$$phase;
    if(phase !== '$apply' && phase !== '$digest') {
        $scope.$apply();  
    }else{
      if($scope.uiUpdateWaiting)  $timeout.cancel($scope.uiUpdateWaiting);
      $scope.uiUpdateWaiting = $timeout(updateUI, 200);
    }
  }

  init();

}]);

theModule.controller('logSourcesModal', [
  '$scope', '$uibModalInstance', 'sources', 
  ($scope, $uibModalInstance, sources) => {

  $scope.sources = sources;
  $scope.url = 'http://localhost';
  $scope.port = 4000;

  $scope.ok = () => $uibModalInstance.close($scope.sources);
  $scope.cancel = () => $uibModalInstance.dismiss('cancel');
  $scope.removeSource = index => $scope.sources.splice(index, 1);
  $scope.addSource = () => {
    if(!$scope.url || !$scope.url.length) return;
    var source = mergePort($scope.url, $scope.port);
    if($scope.sources.indexOf(source)>-1) return; // do not add duplicate
    $scope.sources.push(source);
  }

  function mergePort(url, port){
    if(!port) port = 80;
    var domain, protocol = 'http';
    if (url.indexOf("://") > -1) {
      protocol = url.split('://')[0];
      domain = url.split('/')[2];
    }else {
      domain = url.split('/')[0];
    }
    if(domain.indexOf(':')>-1){
      port = domain.split(':')[1];
      domain= domain.split(':')[0];
    }
    return `${protocol}://${domain}:${port}`;    
  }

}]);

