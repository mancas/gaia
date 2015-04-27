'use strict';

(function (exports) {
  var URL_CONNECT = 'http://telefonicaid.github.io/settings-sw';
  var debug = function(msg) {
    console.log('MANU -> ' + msg);
  };

  function SettingsClient() {
    // Listen to IAC observe messages
    window.addEventListener('navigator-response',
      this.handlerObserveResponse.bind(this));

    var self = this;
    debug('CLIENT connect');
    navigator.connect(URL_CONNECT).then(
      port => {
        self.port = port;

        port.onmessage = function(evt) {
          // Handle reply from the service.
          debug('PORTMANU msg received --> ' + JSON.stringify(evt.data));
          var customEvt = new CustomEvent('navigator-response', evt.data);
          window.dispatchEvent(customEvt);
        };
    });
  }

  SettingsClient.prototype = {
    _observers: [],

    handlerObserveResponse: function ss_handlerObserveResponse(evt) {
      var message = evt.detail;
      if (!evt || message.type !== 'observe') {
        return;
      }

      // Trigger callbacks
      this._observers.forEach(function(entry) {
        if (entry.name === message.name) {
          entry.callback(message.value);
        }
      });
    },

    get: function ss_get(settingKey) {
      if (!settingKey) {
        console.error('Missing parameter: settingKey');
        return;
      }

      return new Promise(function(resolve, reject) {
        window.addEventListener('navigator-response',
          function getSettingListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name != settingKey) {
                return;
            }

            resolve(message.value);
            window.removeEventListener('navigator-response',
              getSettingListener);
        });

        this.sendRequest({
          type: 'get',
          name: settingKey
        });
      }.bind(this));
    },

    set: function ss_set(settingKey, settingValue) {
      if (!settingKey || typeof settingValue === 'undefined') {
        console.error('Missing parameter');
        return;
      }

      return new Promise(function(resolve, reject) {
        window.addEventListener('navigator-response',
          function getSettingListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'set' ||
              message.name != settingKey) {
                return;
            }

            resolve(message.value);
            window.removeEventListener('navigator-response',
              getSettingListener);
        });

        this.sendRequest({
          type: 'set',
          name: settingKey,
          value: settingValue
        });
      }.bind(this));
    },

    observe: function ss_observe(settingKey, defaultValue, callback) {
      if (typeof callback !== 'function') {
        console.error('Missing parameter: callback');
        return;
      }

      this._observers.push({
        name: settingKey,
        callback: callback
      });
debug(this._observers.length);
      this.sendRequest({
        type: 'observe',
        name: settingKey,
        defaultValue: defaultValue
      });
    },

    unobserve: function ss_observe(settingKey, callback) {
      if (typeof callback !== 'function') {
        console.error('Missing parameter: callback');
        return;
      }

      this._removeObserver(settingKey, callback);

      this.sendRequest({
        type: 'unobserve',
        name: settingKey
      });
    },

    sendRequest: function ss_sendRequest(msg) {
debug(JSON.stringify(msg));
      //this.port.postMessage(msg);
    },

    _removeObserver: function ss_removeObserve(settingKey, callback) {
      this._observers.forEach(function(value, index) {
        if (value.name === settingKey && value.callback === callback) {
          this._observers.splice(index, 1);
        }
      }.bind(this));
    }
  };

  exports.SettingsClient = new SettingsClient();
}(window));