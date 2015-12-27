
theModule.controller('mainCtrl', [
  '$scope', '$timeout', '$uibModal', '$filter', '$q', 'NgTableParams', 'appConstants', 'fetchLogs',
  ($scope, $timeout, $uibModal, $filter, $q, NgTableParams, appConstants, fetchLogs) => {
  

  function init(){
    $scope.alerts = [];   
    $scope.prioList = appConstants.prioList;
    $scope.query = new Query();
    $scope.sources = new LogSources();
    $scope.sources.addObserver(onLogSourcesChange);
    $scope.logs = [];
    $scope.tableCols = appConstants.tableColumns;
    var options = appConstants.tableOptions;
    options.getData = ($defer, params) => {
      var data, startIdx, endIdx;
      $scope.logs = $filter('orderBy')($scope.logs, params.orderBy());
      params.total($scope.logs.length);
      startIdx = (params.page()-1)*params.count();
      endIdx = params.page()*params.count();
      data = $scope.logs.slice(startIdx, endIdx);
      return data;
    };
    $scope.dataTable = new NgTableParams(appConstants.tableInitConfig, options);
  }

  function onLogSourcesChange({missing, added}){
    if(missing && missing.length){
      $scope.logs = $scope.logs.filter(log => missing.indexOf(log.source)<-1);
      $scope.dataTable.reload();
    }

    if(added && added.length){
      getLogs(added, _updateId);
    }

  }

  $scope.addAlert = (msg, type) => $scope.alerts.push({msg, type});
  $scope.closeAlert = index => $scope.alerts.splice(index, 1);
  $scope.clearAlerts = () => $scope.alerts = [];
  $scope.updateUI = updateUI;

  $scope.resetQuery = () => {
    $scope.query = new Query();
    angular.element('.date input').each((index, element) => element.data('DateTimePicker').date(null));   // for resetting all the Date Fields
  };

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

  var _updateId=0;
  $scope.search = () => {
    var sources = $scope.sources.list().slice(0); // make a shallow copy
    if(!sources.length) return;
    _updateId++;
    $scope.logs=[];
    getLogs(sources, _updateId);
  }

  function getLogs(sources, updateId){
    $scope.loadingLogs = true;
    var promises = fetchLogs(sources, $scope.query.params())
      .map((promise, index) => promise
        .then(data => {
          // return if this result for previous update or the log source is removed from watch list.
          if(updateId!=_updateId || !$scope.sources.has(sources[index])) return;
          $scope.logs.push.apply($scope.logs, data);
          $scope.dataTable.reload();
        }).catch(e => $scope.addAlert('Error Retriving Log from '+sources[index], 'danger'))
      );
    $q.all(promises).then(()=>{
      if(updateId!=_updateId) return; // not the latest getLogs request
      $scope.loadingLogs = false;
    });
  }


  // For manually triggering DOM update.
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

