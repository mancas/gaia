'use strict';

(function (exports) {
  var URL_CONNECT = 'http://telefonicaid.github.io/fm-sw';
  var debug = function(msg) {
    console.log('MANU FM CLIENT -> ' + msg);
  };

  function FMClient() {
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

          // Resolve pending promises
          if (self._resolvers[evt.data.name]) {
            self._resolvers[evt.data.name].forEach(function(resolve, index) {
              resolve(evt.data.value);
              // Update current state if needed
              self._updateValueIfNeeded(evt.data.name, evt.data.value);

              self._resolvers[evt.data.name].splice(index, 1);
            });
          }

          // Trigger callbacks if needed
          if (evt.data.type === 'listener' && self[evt.data.name]) {
            self[evt.data.name]();
          }
        };
    });
  }

  FMClient.prototype = {
    _observers: [],
    _resolvers: [],
    enabled: false,
    antennaAvailable: null,
    frequencyLowerBound: null,
    frequencyUpperBound: null,
    _listeners: ['onsignalstrengthchange',
                'onfrequencychange',
                'onenabled',
                'ondisabled',
                'onantennaavailablechange'],
    _queue: [],

    onsignalstrengthchange: function fmc_onsignalstrengthchange() {
    },

    onfrequencychange: function fmc_onfrequencychange() {
    },

    onenabled: function fmc_onenabled() {
    },

    ondisabled: function fmc_ondisabled() {
    },

    onantennaavailablechange: function fmc_onantennaavailablechange() {
    },

    disable: function fmc_disable() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('disable', resolve);

        this.sendRequest({
          type: 'disable'
        });
      }.bind(this));
    },

    enable: function fmc_enable(frequency) {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('enable', resolve);

        this.sendRequest({
          type: 'enable',
          args: frequency
        });
      }.bind(this));
    },

    getFrequency: function fmc_getFrequency() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('frequency', resolve);

        this.sendRequest({
          type: 'get',
          name: 'frequency'
        });
      }.bind(this));
    },

    setFrequency: function fmc_setFrequency(freq) {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('frequency', resolve);

        this.sendRequest({
          type: 'set',
          name: 'frequency',
          value: freq
        });
      }.bind(this));
    },

    isEnabled: function fmc_isEnabled() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('enabled', resolve);

        this.sendRequest({
          type: 'get',
          name: 'enabled'
        });
      }.bind(this));
    },

    isAntennaAvailable: function fmc_isAntennaAvailable() {
      return new Promise(function(resolve, reject) {
        if (this.antennaAvailable) {
          resolve(this.antennaAvailable);
          return;
        }

        this._addToResolvers('antennaAvailable', resolve);

        this.sendRequest({
          type: 'get',
          name: 'antennaAvailable'
        });
      }.bind(this));
    },

    seekUp: function fmc_seekUp() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('seekUp', resolve);

        this.sendRequest({
          type: 'execute',
          name: 'seekUp'
        });
      }.bind(this));
    },

    seekDown: function fmc_seekDown() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('seekDown', resolve);

        this.sendRequest({
          type: 'execute',
          name: 'seekDown'
        });
      }.bind(this));
    },

    cancelSeek: function fmc_cancelSeek() {
      return new Promise(function(resolve, reject) {
        this._addToResolvers('cancelSeek', resolve);

        this.sendRequest({
          type: 'execute',
          name: 'cancelSeek'
        });
      }.bind(this));
    },

    getFrequencyLowerBound: function fmc_frequencyLowerBound() {
      return new Promise(function(resolve, reject) {
        if (this.frequencyLowerBound) {
          resolve(this.frequencyLowerBound);
          return;
        }

        this._addToResolvers('frequencyLowerBound', resolve);

        this.sendRequest({
          type: 'get',
          name: 'frequencyLowerBound'
        });
      }.bind(this));
    },

    getFrequencyUpperBound: function fmc_frequencyUpperBound() {
      return new Promise(function(resolve, reject) {
        if (this.frequencyUpperBound) {
          resolve(this.frequencyUpperBound);
          return;
        }

        this._addToResolvers('frequencyUpperBound', resolve);

        this.sendRequest({
          type: 'get',
          name: 'frequencyUpperBound'
        });
      }.bind(this));
    },

    addListeners: function fmc_addListeners() {
      var self = this;
      return new Promise(function(resolve, reject) {
        self._listeners.forEach(function(listener) {
          self.sendRequest({
            type: 'listener',
            name: listener
          });
        });

        resolve();
      });
    },

    sendRequest: function fmc_sendRequest(msg) {
      debug(JSON.stringify(msg));
      if (!this.port) {
        this._queue.push(msg);
        return;
      }
      this.port.postMessage(msg);
    },

    sendPendingMessages: function fmc_sendPengindMessages() {
      debug('Reenviando mensajes');
      while (this._queue.length > 0) {
        this.sendRequest(this._queue.pop());
      }
    },

    _addToResolvers: function fmc_addToResolvers(type, resolve) {
      if (this._resolvers[type]) {
        this._resolvers[type].push(resolve);
      } else {
        this._resolvers[type] = [resolve];
      }
    },

    _updateValueIfNeeded: function fmc_updateValueIfNeeded(type, value) {
      if (typeof this[type] !== 'function') {
        this[type] = value;
      }
    }
  };

  exports.FMClient = new FMClient();
}(window));