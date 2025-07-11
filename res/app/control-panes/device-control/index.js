require('./device-control.css')

module.exports = angular.module('device-control', [
  require('stf/device').name,
  require('stf/control').name,
  require('stf/screen').name,
  require('ng-context-menu').name,
  require('stf/device-context-menu').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/device-control/device-control.pug',
      require('./device-control.pug')
    )
    $templateCache.put('control-panes/device-control/device-control-standalone.pug',
      require('./device-control-standalone.pug')
    )
  }])
  .controller('DeviceControlCtrl', require('./device-control-controller'))
  .directive('deviceControlKey', require('./device-control-key-directive'))
  .controller('UserDeviceControlCtrl', ['$scope', '$rootScope', 'DeviceService', 'GroupService', 'ControlService', '$location', '$timeout', 'AppState', function($scope, $rootScope, DeviceService, GroupService, ControlService, $location, $timeout, AppState) {
    $rootScope.userModeScreen = true

    // --- Автоматический выбор пользователя из списка ---
    var userList = [
      { name: 'tester', email: 'tester@test.com' },
      { name: 'tester1', email: 'tester1@test.com' },
      { name: 'tester2', email: 'tester2@test.com' },
      { name: 'tester3', email: 'tester3@test.com' },
      { name: 'tester4', email: 'tester4@test.com' },
      { name: 'tester5', email: 'tester5@test.com' }
    ];
    var userIdx = 0;
    try {
      var storedIdx = window.localStorage.getItem('userDeviceControlUserIdx');
      userIdx = storedIdx ? parseInt(storedIdx, 10) : 0;
      if (isNaN(userIdx) || userIdx < 0 || userIdx >= userList.length) userIdx = 0;
      window.localStorage.setItem('userDeviceControlUserIdx', (userIdx + 1) % userList.length);
    } catch (e) {
      userIdx = 0;
    }
    var autoUser = userList[userIdx];
    // --- Конец автоматического выбора пользователя ---

    // Установка пользователя из query-параметров или авто-выбранного пользователя
    var params = $location.search();
    var userName = params.name || autoUser.name;
    var userEmail = params.email || autoUser.email;
    
    $rootScope.state.user = { name: userName, email: userEmail };
    AppState.user = { name: userName, email: userEmail };
    $scope.device = null
    $scope.control = null
    $scope.groupDevices = []
    $scope.showScreen = true

    // Track all available devices
    var tracker = DeviceService.trackAll($scope)


    function connectToFirstAvailable() {
      $timeout(function() {
        var available = tracker.devices.filter(function(d) { return d.usable })
        function tryNext(index) {
          if (index >= available.length) {
            alert('Нет доступных устройств или все отказали присоединиться к группе')
            return
          }
          var device = available[index]
          GroupService.invite(device).then(function(device) {
            // Fetch updated device info to get 'using' flag
            DeviceService.get(device.serial, $scope).then(function(updatedDevice) {
              $scope.device = updatedDevice
              // Получаем все устройства пользователя для переключения
              var groupTracker = DeviceService.trackGroup($scope)
              $scope.groupDevices = groupTracker.devices
              $scope.control = ControlService.create(updatedDevice, updatedDevice.channel)
              // Автоматический запуск приложения
              if ($scope.control && $scope.device) {
                $scope.control.shell('am start -n com.flutter.academ.flutter_academ_city/com.ryanheise.audioservice.AudioServiceActivity')
                  .catch(function(err) {
                    alert('Ошибка запуска приложения: ' + (err && (err.code || err.message || err)))
                  })
              }
              // Следим за состоянием устройства
              $scope.$watch('device.state', function(newValue, oldValue) {
                if (oldValue === 'using' && newValue !== 'using') {
                  alert('Устройство отключено или недоступно')
                }
              })
            })
          }).catch(function(err) {
            console.error('Не удалось пригласить устройство:', device.serial, err && (err.message || err))
            tryNext(index + 1)
          })
        }
        if (available.length > 0) {
          tryNext(0)
        } else {
          alert('Нет доступных устройств')
        }
      }, 500)
    }

    connectToFirstAvailable()

    $scope.$on('$destroy', function() {
      $rootScope.userModeScreen = false
    })
  }])
