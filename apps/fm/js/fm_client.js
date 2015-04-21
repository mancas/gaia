'use strict';

(function (exports) {
  var URL_CONNECT = 'http://telefonicaid.github.io/fm-sw';
  var debug = function(msg) {
    console.log('MANU -> ' + msg);
  };

  function FMClient() {
    // Listen to IAC observe messages
    window.addEventListener('ncsresponse',
      this.handleListenerResponse.bind(this));

    var self = this;
    debug('CLIENT connect');
    navigator.connect(URL_CONNECT).then(
      function(port) {
        self.port = port;

        port.onmessage = function(evt) {
          // Handle reply from the service.
          debug('msg received --> ' + JSON.stringify(evt.data));
          var customEvt = new CustomEvent('ncsresponse', evt.data);
          window.dispatchEvent(customEvt);
        };

        self.addListeners();
    });
  }

  FMClient.prototype = {
    _observers: [],
    frequency: null,
    enabled: false,
    antennaAvailable: true,
    frequencyLowerBound: null,
    frequencyUpperBound: null,
    _listeners: ['onsignalstrengthchange',
                'onfrequencychange',
                'onenabled',
                'ondisabled',
                'onantennaavailablechange'],

    handleListenerResponse: function fmc_handleListenerResponse(evt) {
      var message = evt.detail;
      if (!evt || message.type !== 'listener') {
        return;
      }

      // Trigger callbacks
      this._observers.forEach(function(entry) {
        if (entry.name === message.name) {
          entry.callback(message.value);
        }
      });
    },

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
        var self = this;
        window.addEventListener('ncsresponse',
          function enableListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'disable') {
                return;
            }

            resolve(message.value);
            if (message.value)
              self.enabled = false;
            window.removeEventListener('ncsresponse', enableListener);
        });

        this.sendRequest({
          type: 'disable'
        });
      }.bind(this));
    },

    enable: function fmc_enable(frequency) {
      return new Promise(function(resolve, reject) {
        var self = this;
        window.addEventListener('ncsresponse',
          function enableListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'enable') {
                return;
            }

            resolve(message.value);
            if (message.value)
              self.enabled = false;
            window.removeEventListener('ncsresponse', enableListener);
        });

        this.sendRequest({
          type: 'enable',
          args: frequency
        });
      }.bind(this));
    },

    getFrequency: function fmc_getFrequency() {
      return new Promise(function(resolve, reject) {
        if (this.frequency) {
          resolve(frequency);
          return;
        }

        var self = this;
        window.addEventListener('ncsresponse',
          function getFrequencyListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name != 'frequency') {
                return;
            }

            resolve(message.value);
            self.frequency = message.value;
            window.removeEventListener('ncsresponse',
              getFrequencyListener);
        });

        this.sendRequest({
          type: 'get',
          name: 'frequency'
        });
      }.bind(this));
    },

    setFrequency: function fmc_setFrequency(freq) {
      return new Promise(function(resolve, reject) {
        var self = this;
        window.addEventListener('ncsresponse',
          function setFrequencyListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'set' ||
              message.name != 'frequency') {
                return;
            }

            resolve(message.value);
            if (message.value)
              self.frequency = freq;
            window.removeEventListener('ncsresponse',
              setFrequencyListener);
        });

        this.sendRequest({
          type: 'set',
          name: 'frequency',
          value: freq
        });
      }.bind(this));
    },

    isEnabled: function fmc_isEnabled() {
      return new Promise(function(resolve, reject) {
        if (this.enabled) {
          resolve(this.enabled);
          return;
        }

        var self = this;
        window.addEventListener('ncsresponse',
          function getEnabledListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name != 'enabled') {
                return;
            }

            resolve(message.value);
            self.enabled = message.value;
            window.removeEventListener('ncsresponse',
              getEnabledListener);
        });

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

        var self = this;
        window.addEventListener('ncsresponse',
          function getEnabledListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name != 'antennaAvailable') {
                return;
            }

            resolve(message.value);
            self.antennaAvailable = message.value;
            window.removeEventListener('ncsresponse',
              getEnabledListener);
        });

        this.sendRequest({
          type: 'get',
          name: 'antennaAvailable'
        });
      }.bind(this));
    },

    seekUp: function fmc_seekUp() {
      return new Promise(function(resolve, reject) {
        window.addEventListener('ncsresponse',
          function seekUpListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'seekUp') {
                return;
            }

            resolve(message.value);
            window.removeEventListener('ncsresponse',
              seekUpListener);
        });

        this.sendRequest({
          type: 'seekUp'
        });
      });
    },

    seekDown: function fmc_seekDown() {
      eturn new Promise(function(resolve, reject) {
        window.addEventListener('ncsresponse',
          function seekDownListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'seekDown') {
                return;
            }

            resolve(message.value);
            window.removeEventListener('ncsresponse',
              seekDownListener);
        });

        this.sendRequest({
          type: 'seekDown'
        });
      });
    },

    cancelSeek: function fmc_cancelSeek() {
      return new Promise(function(resolve, reject) {
        window.addEventListener('ncsresponse',
          function cancelSeekListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'cancelSeek') {
                return;
            }

            resolve(message.value);
            window.removeEventListener('ncsresponse',
              cancelSeekListener);
        });

        this.sendRequest({
          type: 'cancelSeek'
        });
      });
    },

    getFrequencyLowerBound: frequency fmc_frequencyLowerBound() {
      return new Promise(function(resolve, reject) {
        if (this.frequencyLowerBound) {
          resolve(this.frequencyLowerBound);
          return;
        }

        window.addEventListener('ncsresponse',
          function getFrequencyLowerBoundListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name !== 'frequencyLowerBound') {
                return;
            }

            resolve(message.value);
            self.frequencyLowerBound = message.value;
            window.removeEventListener('ncsresponse',
              getFrequencyLowerBoundListener);
        });

        this.sendRequest({
          type: 'get',
          name: 'frequencyLowerBound'
        });
      }.bind(this));
    },

    getFrequencyUpperBound: frequency fmc_frequencyUpperBound() {
      return new Promise(function(resolve, reject) {
        if (this.frequencyUpperBound) {
          resolve(this.frequencyUpperBound);
          return;
        }

        window.addEventListener('ncsresponse',
          function getFrequencyUpperBoundListener(evt) {
            var message = evt.detail;

            if (!evt || message.type !== 'get' ||
              message.name !== 'frequencyUpperBound') {
                return;
            }

            resolve(message.value);
            self.frequencyUpperBound = message.value;
            window.removeEventListener('ncsresponse',
              getFrequencyUpperBoundListener);
        });

        this.sendRequest({
          type: 'get',
          name: 'frequencyUpperBound'
        });
      }.bind(this));
    },

    addListeners: function fmc_addListeners() {
      this._listeners.forEach(function(listener) {
        this.sendRequest({
          type: 'listener',
          name: name
        });
      });

      window.addEventListener('ncsresponse', function(evt) {
        var message = evt.detail;

        if (!evt || message.type !== 'listener' ||
          this._listeners.indexOf(message.name) === -1) {
            return;
        }

        if (this[message.type]) {
          this[message.type]();
        }
      });
    },

    sendRequest: function fmc_sendRequest(msg) {
      this.port.postMessage(msg);
    }
  };

  exports.FMClient = new FMClient();
}(window));