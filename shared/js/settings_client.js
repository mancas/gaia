'use strict';

(function (exports) {
  var URL_CONNECT = 'http://telefonicaid.github.io/settings-sw';
  var debug = function(msg) {
    console.log('MANU SETTINGS CLIENT -> ' + msg);
  };

  function SettingsClient() {
    var self = this;
    debug('CLIENT connect');
    navigator.connect(URL_CONNECT).then(
      port => {
        self.port = port;
        debug('CLIENT connected');
        self.sendPendingMessages();

        port.onmessage = function(evt) {
          // Handle reply from the service.
          debug('Message received --> ' + JSON.stringify(evt.data));

          switch (evt.data.type) {
            case 'get':
              self._getResolvers[evt.data.name].forEach(
                function(resolve, index) {
                  resolve(evt.data.value);
                  self._getResolvers[evt.data.name].splice(index, 1);
              });
              break;
            case 'set':
              self._setResolvers[evt.data.name].forEach(
                function(resolve, index) {
                  resolve(evt.data.value);
                  self._setResolvers[evt.data.name].splice(index, 1);
              });
              break;
            case 'observe':
              // Trigger callbacks
              this._observers.forEach(function(entry) {
                if (entry.name === evt.data.name) {
                  entry.callback(evt.data.value);
                }
              });
              break;
          }
        };
    });
  }

  SettingsClient.prototype = {
    _observers: [],
    _queue: [],
    _getResolvers: [],
    _setResolvers: [],

    get: function ss_get(settingKey) {
      if (!settingKey) {
        console.error('Missing parameter: settingKey');
        return;
      }

      return new Promise(function(resolve, reject) {
        this._addToResolvers('get', settingKey, resolve);

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
        this._addToResolvers('set', settingKey, resolve);

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
      if (!this.port) {
        this._queue.push(msg);
        return;
      }
      this.port.postMessage(msg);
    },

    sendPendingMessages: function ss_sendPengindMessages() {
      while (this._queue.length > 0) {
        this.sendRequest(this._queue.pop());
      }
    },

    _addToResolvers: function fmc_addToResolvers(type, setting, resolve) {
      switch (type) {
        case 'get':
          if (this._getResolvers[setting]) {
            this._getResolvers[setting].push(resolve);
          } else {
            this._getResolvers[setting] = [resolve];
          }
          break;
        case 'set':
          if (this._setResolvers[setting]) {
            this._setResolvers[setting].push(resolve);
          } else {
            this._setResolvers[setting] = [resolve];
          }
          break;
      }
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