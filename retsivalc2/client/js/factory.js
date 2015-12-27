theModule.constant('appConstants', {
  uri: '/log',
  prioList: {
    ' ': '',
    0: 'Emergency',
    1: 'Alert',
    2: 'Critical',
    3: 'Error',
    4: 'Warning',
    5: 'Notice',
    6: 'Informational',
    7: 'Debug'
  },
  tableInitConfig: {
    sorting: { time: "desc" },
    page:1,
    count: 50
  },
  tableOptions: {
    counts: [30, 50, 100],
    paginationMaxBlocks: 5,
    paginationMinBlocks: 1  
  },
  tableColumns: [
    { field: 'time', title: 'Date', sortable: 'time', show: true },
    { field: 'ip', title: 'IP', sortable: 'ip', show: true },
    { field: 'prio', title: 'Severity', sortable: 'prio', show: true },
    { field: 'cat', title: 'Category', sortable: 'cat', show: true },
    { field: 'event', title: 'Event', sortable: 'event', show: true },
    { field: 'action', title: 'Action', sortable: 'action', show: true },
    { field: 'message', title: 'Message', sortable: 'message', show: true }
  ]

}).factory('fetchLogs',['$http', 'appConstants', ($http, appConstants) => {
  function fetchLogs(sources, params){
    console.log('hit fetchLogs', sources, params);
    return sources.map(source =>{
      return $http.get(source+appConstants.uri, {params})
        .then(response => {
          formatData(response.data, source);
          return response.data;
        })
    });
  }


  function formatData(data, source){
    data.forEach(datum => {
      datum.prio = appConstants.prioList[datum.prio];
      datum.message = (/action=\w+\s+/).test(datum.message)? datum.message.split(/action=\w+\s+/)[1] : datum.message.split(/event=\w+\s+/)[1];
      datum.source = source;
    });
  }

  return fetchLogs;
}]);

