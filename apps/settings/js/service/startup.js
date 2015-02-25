'use strict';
/* global AirplaneModeHelper */

/* This service is used to offer settings to privileged apps. */

(function (exports) {
  function SettingService() {
    navigator.mozSetMessageHandler('connection', this.onConnection.bind(this));
    this.mozSettings = window.navigator.mozSettings;
    this.handleAirplaneModeChange = this.onAirplaneModeChange.bind(this);
    this.handleSettingChange = this.onSettingChange.bind(this);
  }

  SettingService.prototype = {
    _observers: [],

    onConnection: function ss_onConnection(connectionRequest) {
      if (connectionRequest.keyword !== 'appsettingrequired') {
        window.DUMP('Invalid received message. Expected "appsettingrequired",' +
          ' got "' + connectionRequest.keyword + '"');
        return;
      }

      var port = connectionRequest.port;
      port.onmessage = this.handleRequest.bind(this);
      port.start();
    },

    handleRequest: function ss_handleRequest(evt) {
      if (!evt.data.type || !evt.data.settingKey) {
        window.DUMP('Message received bad formed');
        return;
      }

      if (this[evt.data.type]) {
        this[evt.data.type](evt.data);
      }
    },

    get: function ss_get(data) {
      var lock = this.mozSettings.createLock();
      var request = lock.get(data.settingKey);

      request.onsuccess = function() {
        window.DUMP('Get setting value success: ' +
          request.result[data.settingKey]);
        this.respondRequest({
          type: 'get',
          settingKey: data.settingKey,
          value: request.result[data.settingKey]
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest({
          type: 'get',
          settingKey: data.settingKey,
          value: false
        });
      }.bind(this);
    },

    set: function ss_set(data) {
      if (!data.value) {
        window.DUMP('Message received bad formed. Missing parameter: value');
        return;
      }

      var lock = this.mozSettings.createLock();
      var cset = {};
      cset[data.settingKey] = data.value;
      var request = lock.set(cset);

      request.onsuccess = function() {
        window.DUMP('Update setting value success');
        this.respondRequest({
          type: 'set',
          settingKey: data.settingKey,
          result: true
        });
      }.bind(this);

      request.onerror = function() {
        window.DUMP('Something went wrong');
        this.respondRequest({
          type: 'set',
          settingKey: data.settingKey,
          result: false
        });
      }.bind(this);
    },

    observe: function ss_observe(data) {
      if (!this.mozSettings) {
        window.setTimeout(function() {
          this.handleSettingChange(data.defaultValue);
        });
        return;
      }

      var request = this.mozSettings.createLock().get(data.settingKey);

      request.onsuccess = function() {
        var value = typeof(request.result[data.settingKey]) != 'undefined' ?
          request.result[data.settingKey] : data.defaultValue;
        this.handleSettingChang(data.settingKey, value);
      };

      var settingChanged = function settingChanged(evt) {
        this.handleSettingChange(data.settingKey, evt.settingValue);
      };
      this.mozSettings.addObserver(data.settingKey, settingChanged);
      this._observers.push({
        name: data.settingKey,
        callback: this.handleSettingChange,
        observer: settingChanged
      });
    },

    unobserve: function ss_unobserve(data) {
      this._observers.forEach(function(value, index) {
        if (value.name === data.settingKey) {
          this.mozSettings.removeObserver(name, value.observer);
          this._observers.splice(index, 1);
        }
      }.bind(this));
    },

    onSettingChange: function ss_onSettingChange(settingKey, settingValue) {
      this.respondRequest({
        type: 'observe',
        settingKey: settingKey,
        value: settingValue
      });
    },

    observeAirplaneMode: function ss_observeAirplaneMode(data) {
      AirplaneModeHelper.ready(function() {
        this.onAirplaneModeChange(AirplaneModeHelper.getStatus());
        AirplaneModeHelper.addEventListener('statechange',
          this.handleAirplaneModeChange);
        console.info(AirplaneModeHelper._callbacks.length);
      }.bind(this));
    },

    onAirplaneModeChange: function ss_onAirplaneModeChange(status) {
      console.info(status);
      this.respondRequest({
        type: 'observeAirplaneMode',
        value: status === 'enabled'
      });
    },

    respondRequest: function ss_respondRequest(response) {
      window.DUMP('response: ' + response);
      navigator.mozApps.getSelf().onsuccess = function(evt) {
        var app = evt.target.result;
        app.connect('appsettingrequired').then(function onConnAccepted(ports) {
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