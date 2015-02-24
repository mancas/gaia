'use strict';

(function (exports) {
  function SettingService() {
    navigator.mozSetMessageHandler('connection', this.onConnection.bind(this));
    this.mozSettings = window.navigator.mozSettings;
  }

  SettingService.prototype = {
    onConnection: function ss_onConnection(connectionRequest) {
      if (connectionRequest.keyword !== 'appSettingRequired') {
        window.DUMP('Invalid received message. Expected "appSettingRequired",' +
          ' got "' + connectionRequest.keyword + '"');
        return;
      }

      var port = connectionRequest.port;
      port.onmessage = this.handleRequest.bind(this);
      port.start();
    },

    handleRequest: function ss_handleRequest(evt) {
      if (!evt.data.type || !evt.data.key) {
        window.DUMP('Message received bad formed');
        return;
      }

      if (this[evt.data.type]) {
        this[evt.data.type](evt.data);
      }
    },

    get: function ss_get(data) {
      var lock = this.mozSettings.createLock();
      var request = lock.get(data.key);

      request.onsuccess = function() {
        window.DUMP('Get setting value success: ' + request.result[data.key]);
        this.respondRequest(request.result[data.key]);
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest(false);
      }.bind(this);
    },

    set: function ss_set(data) {
      if (!data.value) {
        window.DUMP('Message received bad formed. Missing parameter: value');
        return;
      }

      var lock = this.mozSettings.createLock();
      var cset = {};
      cset[data.key] = data.value;
      var request = lock.set(cset);

      request.onsuccess = function() {
        window.DUMP('Update setting value success');
        this.respondRequest(true);
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest(false);
      }.bind(this);
    },

    respondRequest: function ss_respondRequest(response) {
      navigator.mozApps.getSelf().onsuccess = function(evt) {
        var app = evt.target.result;
        app.connect('appSettingRequired').then(function onConnAccepted(ports) {
          window.DUMP('AppSettingRequired IAC: ' + ports);
          ports.forEach(function(port) {
            window.DUMP('AppSettingRequired IAC: ' + port);
            port.postMessage(response);
          });
        }, function onConnRejected(reason) {
          window.DUMP('AppSettingRequired IAC is rejected');
          window.DUMP(reason);
        });
      };
    }
  };

  exports.SettingService = new SettingService();
}(window));