'use strict';
/* global mozFMRadio, FavoritesList, HistoryList,
 FrequencyDialer, PerformanceTestingHelper */
/* exported UIManager */

function $(id) {
  return document.getElementById(id);
}

function $$(expr) {
  return document.querySelectorAll(expr);
}

function toCamelCase(str) {
  return str.replace(/\-(.)/g, function replacer(str, p1) {
    return p1.toUpperCase();
  });
}

var UIManager = {
  _enabling: false,
  _airplaneModeEnabled: false,
  elements: {},
  domSelectors: [
    'bookmark-button',
    'power-switch',
    'antenna-warning',
    'airplane-mode-warning',
    'frequency-bar',
    'frequency-dialer',
    'dialer-container',
    'frequency',
    'fav-list-container',
    'frequency-op-seekdown',
    'frequency-op-seekup',
    'speaker-switch'
  ],

  init: function um_init() {
    // Initialization of the DOM selectors
    this.domSelectors.forEach(function createElementRef(name) {
      this[toCamelCase(name)] = $(name);
    }.bind(this));
  },

  updateFreqUI: function um_updateFreqUI() {
    HistoryList.add(mozFMRadio.frequency);
    FrequencyDialer.setFrequency(mozFMRadio.frequency);
    var frequency = FrequencyDialer.getFrequency();
    FavoritesList.select(frequency);
    this.bookmarkButton.dataset.bookmarked = FavoritesList.contains(frequency);
    this.bookmarkButton.setAttribute('aria-pressed',
      FavoritesList.contains(frequency));
  },

  updatePowerUI: function um_updatePowerUI() {
    var enabled = mozFMRadio.enabled;
    if (enabled) {
      window.performance.mark('fmRadioEnabled');
      PerformanceTestingHelper.dispatch('fm-radio-enabled');
      // ACCESSIBILITY - Must set data-l10n-id to reflect Off switch
      this.powerSwitch.setAttribute('data-l10n-id', 'power-switch-off');
    } else {
      // ACCESSIBILITY - Must set data-l10n-id to reflect On switch
      this.powerSwitch.setAttribute('data-l10n-id', 'power-switch-on');
    }
    console.log('Power status: ' + (enabled ? 'on' : 'off'));
    this.powerSwitch.dataset.enabled = enabled;
    this.powerSwitch.dataset.enabling = this._enabling;
  },

  updateAntennaUI: function um_updateAntennaUI() {
    this.antennaWarning.hidden = mozFMRadio.antennaAvailable;
  },

  updateAirplaneModeUI: function um_updateAirplaneModeUI() {
    this.airplaneModeWarning.hidden = !this._airplaneModeEnabled;
  },

  updateFrequencyBarUI: function um_updateFrequencyBarUI() {
    if (this._enabling) {
      this.frequencyBar.classList.add('dim');
    } else {
      this.frequencyBar.classList.remove('dim');
    }
  },

  updateEnablingState: function um_updateEnablingState(enablingState) {
    this._enabling = enablingState;
    this.updatePowerUI();
    this.updateFrequencyBarUI();
  },

  enableFMRadio: function um_enableFMRadio(frequency) {
    if (this._airplaneModeEnabled)
      return;

    var request = mozFMRadio.enable(frequency);
    // Request might fail, see bug862672
    request.onerror = function onerror_enableFMRadio(event) {
      this.updateEnablingState(false);
    }.bind(this);

    this.updateEnablingState(true);
  },

  /**
   * If the FM radio is seeking currently, cancel it and then set frequency.
   *
   * @param {freq} frequency set.
   */
  cancelSeekAndSetFreq: function um_cancelSeekAndSetFreq(frequency) {
    function setFreq() {
      mozFMRadio.setFrequency(frequency);
    }

    var seeking = !!this.powerSwitch.getAttribute('data-seeking');
    if (!seeking) {
      setFreq();
    } else {
      var request = mozFMRadio.cancelSeek();
      request.onsuccess = setFreq;
      request.onerror = setFreq;
    }
  }
};
