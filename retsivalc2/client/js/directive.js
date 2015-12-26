
theModule.directive('myDatePicker',[() => {

  return {
    require: '?ngModel',
    link: (scope, element, attrs, ngModelCtrl) => {
      element.datetimepicker({
        sideBySide: true,
        format:'YYYY-MM-DDTHH:mm:ss'
      }).on('dp.change', function(e){
        ngModelCtrl.$setViewValue(element.data().date);
        scope.updateUI();
      }).data('DateTimePicker')
      .maxDate(new Date())
      .showClear(true)
      .showTodayButton(true)
      .showClose(true);
    }
  };
}]);
