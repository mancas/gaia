'use strict';

window.addEventListener('DOMContentLoaded', function() {
  LazyLoader.load([
    '/shared/js/l10n.js'], function() {
    LazyLoader.load([
      document.getElementById('view-contact-details')
    ], function() {
      // TODO Add if needed
    });
  });
});

window.onload = function() {
  var dependencies = [
    '/contacts/style/webrtc-client/webrtc_client.css',
    '/contacts/js/webrtc-client/webrtc_client.js',
    '/contacts/services/contacts.js',
    '/contacts/js/activities.js',
    '/shared/js/contacts/utilities/event_listeners.js',
    '/shared/js/l10n_date.js',
    '/shared/js/contacts/import/utilities/config.js',
    '/contacts/js/utilities/extract_params.js',
    '/contacts/js/utilities/cookie.js',
    '/shared/js/contact_photo_helper.js',
    '/shared/js/contacts/contacts_buttons.js',
    '/shared/js/text_normalizer.js',
    '/shared/js/contacts/utilities/dom.js',
    '/shared/js/contacts/utilities/templates.js',
    '/shared/js/contacts/import/utilities/misc.js',
    '/dialer/js/telephony_helper.js',
    '/shared/js/contacts/sms_integration.js',
    '/contacts/js/fb_loader.js',
    '/contacts/views/details/js/details_ui.js',
    '/contacts/views/details/js/details.js'
  ];

  LazyLoader.load(dependencies, function() {
    fbLoader.load();

    navigator.mozSetMessageHandler('activity', activity => {
      window.Details.init(activity);
      var id = activity.source.data.params.id;

      ContactsService.get(id, function onSuccess(savedContact) {
        window.DetailsUI.init(savedContact, true);
      }, function onError() {
        console.error('Error retrieving contact');
      });
    });

    navigator.mozContacts.oncontactchange = evt => {
      var json = {
        contactID: evt.contactID,
        reason: evt.reason
      };
      sessionStorage.setItem('oncontactchange', JSON.stringify(json));
    };

  });
};