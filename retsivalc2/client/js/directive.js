
theModule.directive('angTestDir', [() => {



  function link(scope, element, attrs) {  
    console.log('hit directive...');
  }  

  return { 
    scope: false,
    link,
    templateUrl: `${partialsSourceDir}angTestDir.html`
  };  
}]);
