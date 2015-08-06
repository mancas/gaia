/* global SettingsUI, Settings, LazyLoader */
'use strict';

window.addEventListener('DOMContentLoaded', function() {
  LazyLoader.load([
    '/shared/js/l10n.js'], function() {
    LazyLoader.load([
      document.getElementById('settings-wrapper'),
      document.getElementById('loading-overlay'),
      document.getElementById('confirmation-message')
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
    '/contacts/views/settings/js/main_navigation.js',
    '/contacts/js/activities.js',
    '/contacts/js/fb_loader.js',
    '/shared/js/async_storage.js',
    '/shared/elements/gaia_switch/script.js',
    '/contacts/js/utilities/normalizer.js',
    '/contacts/js/service_extensions.js',
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

  LazyLoader.load(['/contacts/js/fb_loader.js'], function() {
    fbLoader.load();
    LazyLoader.load(dependencies, function() {
      console.info("loaded");
      SettingsUI.init();
      Settings.init();
    });
  });
};