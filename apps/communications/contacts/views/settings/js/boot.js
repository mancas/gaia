/* global SettingsUI, Settings, LazyLoader */
'use strict';

window.addEventListener('DOMContentLoaded', function() {
  LazyLoader.load([
    '/shared/js/l10n.js'], function() {
    LazyLoader.load([
      document.getElementById('settings-wrapper'),
      document.getElementById('loading-overlay')
    ], function() {
      // TODO Add if needed
    });
  });
});

window.onload = function() {

  /* FIX: This should be done on */
  /* /contacts/views/settings/js/settings_controller.js */
  window._ = navigator.mozL10n.get;

  var dependencies = [
    '/contacts/js/navigation.js',
    '/shared/js/contacts/utilities/event_listeners.js',
    '/shared/js/contacts/import/utilities/sdcard.js',
    '/contacts/js/utilities/cookie.js',
    /* FIX: This should be deleted. Load function */
    /* will be extracted from Contacts */
    '/contacts/services/contacts.js',
    '/contacts/js/contacts.js',
    /* FIX */
    '/contacts/js/utilities/icc_handler.js',
    '/contacts/js/utilities/sim_dom_generator.js',
    '/contacts/views/settings/js/controller.js',
    '/contacts/views/settings/js/settings_ui.js',
    '/contacts/views/settings/js/settings_controller.js'
  ];

  LazyLoader.load(dependencies, function() {
    SettingsUI.init();
    Settings.init();
  });
};