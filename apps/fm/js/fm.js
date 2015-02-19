'use strict';
/* global mozFMRadio, SpeakerManager */

function init() {
  FrequencyDialer.init();

  var seeking = false;
  function onclick_seekbutton(event) {
    var seekButton = this;
    var seeking = !!UIManager.powerSwitch.getAttribute('data-seeking');
    var up = seekButton.id == 'frequency-op-seekup';

    function seek() {
      UIManager.powerSwitch.dataset.seeking = true;

      var request = up ? mozFMRadio.seekUp() : mozFMRadio.seekDown();

      request.onsuccess = function seek_onsuccess() {
        UIManager.powerSwitch.removeAttribute('data-seeking');
      };

      request.onerror = function seek_onerror() {
        UIManager.powerSwitch.removeAttribute('data-seeking');
      };
    }

    // If the FM radio is seeking channel currently, cancel it and seek again.
    if (seeking) {
      var request = mozFMRadio.cancelSeek();
      request.onsuccess = seek;
      request.onerror = seek;
    } else {
      seek();
    }
  }

  UIManager.frequencyOpSeekdown.addEventListener('click',
                                   onclick_seekbutton, false);
  UIManager.frequencyOpSeekup.addEventListener('click',
                                   onclick_seekbutton, false);

  UIManager.powerSwitch.addEventListener('click', function toggle_fm() {
    if (mozFMRadio.enabled) {
      mozFMRadio.disable();
    } else {
      UIManager.enableFMRadio(FrequencyDialer.getFrequency());
    }
  }, false);

  UIManager.bookmarkButton.addEventListener('click',
    function toggle_bookmark() {
      var frequency = FrequencyDialer.getFrequency();
      if (FavoritesList.contains(frequency)) {
        FavoritesList.remove(frequency);
      } else {
        FavoritesList.add(frequency);
      }
      UIManager.updateFreqUI();
  }, false);

  var speakerManager = new SpeakerManager();
  UIManager.speakerSwitch.addEventListener('click', function toggle_speaker() {
    speakerManager.forcespeaker = !speakerManager.speakerforced;
  }, false);

  speakerManager.onspeakerforcedchange = function onspeakerforcedchange() {
    UIManager.speakerSwitch.dataset.speakerOn = speakerManager.speakerforced;
    UIManager.speakerSwitch.setAttribute('aria-pressed',
      speakerManager.speakerforced);
  };

  mozFMRadio.onfrequencychange = UIManager.updateFreqUI;
  mozFMRadio.onenabled = function() {
    UIManager.updateEnablingState(false);
  };
  mozFMRadio.ondisabled = function() {
    UIManager.updateEnablingState(false);
  };

  mozFMRadio.onantennaavailablechange = function onAntennaChange() {
    UIManager.updateAntennaUI();
    if (mozFMRadio.antennaAvailable) {
      // If the FM radio is enabled or enabling when the antenna is unplugged,
      // turn the FM radio on again.
      if (!!window._previousFMRadioState || !!window._previousEnablingState) {
        UIManager.enableFMRadio(FrequencyDialer.getFrequency());
      }
    } else {
      // Remember the current state of the FM radio
      window._previousFMRadioState = mozFMRadio.enabled;
      window._previousEnablingState = enabling;
      mozFMRadio.disable();
    }
  };

  // Disable the power button and the fav list when the airplane mode is on.
  UIManager.updateAirplaneModeUI();

  AirplaneModeHelper.addEventListener('statechange', function(status) {
    UIManager._airplaneModeEnabled = status === 'enabled';
    UIManager.updateAirplaneModeUI();
  });

  // Load the fav list and enable the FM radio if an antenna is available.
  HistoryList.init(function hl_ready() {
    if (mozFMRadio.antennaAvailable) {
      // Enable FM immediately
      if (HistoryList.last() && HistoryList.last().frequency)
        UIManager.enableFMRadio(HistoryList.last().frequency);
      else
        UIManager.enableFMRadio(mozFMRadio.frequencyLowerBound);

      FavoritesList.init(UIManager.updateFreqUI);
    } else {
      // Mark the previous state as True,
      // so the FM radio be enabled automatically
      // when the headset is plugged.
      window._previousFMRadioState = true;
      UIManager.updateAntennaUI();
      FavoritesList.init();
    }
    UIManager.updatePowerUI();

    // PERFORMANCE EVENT (5): moz-app-loaded
    // Designates that the app is *completely* loaded and all relevant
    // "below-the-fold" content exists in the DOM, is marked visible,
    // has its events bound and is ready for user interaction. All
    // required startup background processing should be complete.
    window.performance.mark('fullyLoaded');
    window.dispatchEvent(new CustomEvent('moz-app-loaded'));
  });

  //
  // If the system app is opening an attention screen (because
  // of an incoming call or an alarm, e.g.) and if we are
  // currently playing the radio then we need to stop the radio
  // before the ringer or alarm starts sounding. See bugs 995540
  // and 1006200.
  //
  // XXX We're abusing the settings API here to allow the system app
  // to broadcast a message to any certified apps that care. There
  // ought to be a better way, but this is a quick and easy way to
  // fix a last-minute release blocker.
  //
  navigator.mozSettings.addObserver(
    'private.broadcast.attention_screen_opening',
    function(event) {
      // An attention screen is in the process of opening. Save the
      // current state of the radio and disable.
      if (event.settingValue) {
        window._previousFMRadioState = mozFMRadio.enabled;
        window._previousEnablingState = enabling;
        window._previousSpeakerForcedState = speakerManager.speakerforced;
        mozFMRadio.disable();
      }

      // An attention screen is closing.
      else {
        // If the radio was previously enabled or was in the process
        // of becoming enabled, re-enable the radio.
        if (!!window._previousFMRadioState || !!window._previousEnablingState) {
          // Ensure the antenna is still available before re-starting
          // the radio.
          if (mozFMRadio.antennaAvailable) {
            UIManager.enableFMRadio(FrequencyDialer.getFrequency());
          }

          // Re-enable the speaker if it was previously forced.
          speakerManager.forcespeaker = !!window._previousSpeakerForcedState;
        }
      }
    }
  );
}

window.addEventListener('load', function(e) {
  UIManager.init();
  AirplaneModeHelper.ready(function() {
    UIManager._airplaneModeEnabled =
      AirplaneModeHelper.getStatus() == 'enabled';
    init();

    // PERFORMANCE EVENT (2): moz-chrome-interactive
    // Designates that the app's *core* chrome or navigation interface
    // has its events bound and is ready for user interaction.
    window.performance.mark('navigationInteractive');
    window.dispatchEvent(new CustomEvent('moz-chrome-interactive'));

    // PERFORMANCE EVENT (3): moz-app-visually-complete
    // Designates that the app is visually loaded (e.g.: all of the
    // "above-the-fold" content exists in the DOM and is marked as
    // ready to be displayed).
    window.performance.mark('visuallyLoaded');
    window.dispatchEvent(new CustomEvent('moz-app-visually-complete'));

    // PERFORMANCE EVENT (4): moz-content-interactive
    // Designates that the app has its events bound for the minimum
    // set of functionality to allow the user to interact with the
    // "above-the-fold" content.
    window.performance.mark('contentInteractive');
    window.dispatchEvent(new CustomEvent('moz-content-interactive'));
  });
}, false);

// Turn off radio immediately when window is unloaded.
window.addEventListener('unload', function(e) {
  mozFMRadio.disable();
}, false);

// PERFORMANCE EVENT (1): moz-chrome-dom-loaded
// Designates that the app's *core* chrome or navigation interface
// exists in the DOM and is marked as ready to be displayed.
window.performance.mark('navigationLoaded');
window.dispatchEvent(new CustomEvent('moz-chrome-dom-loaded'));
