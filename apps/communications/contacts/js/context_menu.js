(function(exports) {
  'use strict';
  exports.CustomContextMenu = {
    buttons: [
      {
        selector: '.call-contact',
        method: 'call'
      },{
        selector: '.share-contact',
        method: 'share'
      },{
        selector: '.delete-contact',
        method: 'delete'
      }],
    _uuid: null,
    _defaultCardIndex: null,

    init: function() {
      var self = this;
      this.dialog = document.querySelector('gaia-dialog-menu');
      this.buttons.forEach(function(btnInfo) {
        var btn = document.querySelector(btnInfo.selector);

        btn.addEventListener('click', function() {
          console.info('Button clicked! ' + btnInfo.selector);
          console.info('Contact ID: ' + self.uuid);
          self[btnInfo.method]();
          self.dialog.close();
        });
      });

      LazyLoader.load(['/shared/js/settings_listener.js'], function() {
        SettingsListener.observe('ril.telephony.defaultServiceId', 0,
                                 function(cardIndex) {
                                  self._defaultCardIndex = cardIndex;
                                 });
      });
    },

    _getCardIndexIfLoaded: function() {
      if (window.TelephonyHelper) {
        var inUseSim = window.TelephonyHelper.getInUseSim();
        if (inUseSim !== null) {
          return inUseSim;
        }
      }

      return this._defaultCardIndex;
    },

    call: function() {
      console.info('call');
      this.getContact().then(contact => {
        if (contact.tel.length > 0)
          LazyLoader.load('/dialer/js/telephony_helper.js', () => {
            TelephonyHelper.call(Normalizer.escapeHTML(contact.tel[0].value),
              this._getCardIndexIfLoaded());
          });
      });
    },

    share: function() {
      console.info('share');
      this.getContact().then(contact => {
        const VCARD_DEPS = [
          '/shared/js/text_normalizer.js',
          '/shared/js/contact2vcard.js',
          '/shared/js/setImmediate.js'
        ];

        LazyLoader.load(VCARD_DEPS,function vcardLoaded() {
          ContactToVcardBlob([contact], function blobReady(vcardBlob) {
            var filename = VcardFilename(contact);
             /* jshint nonew: false */
            new MozActivity({
              name: 'share',
              data: {
                type: 'text/vcard',
                number: 1,
                blobs: [new window.File([vcardBlob], filename)],
                filenames: [filename]
              }
            });
            // The MIME of the blob should be this for some MMS gateways
          }, { type: 'text/x-vcard'} );
        });
      });
    },

    delete: function() {
      console.info('delete');
      this.getContact().then(contact => {
        ContactsService.remove(
          contact,
          function(e) {
            if (e) {
              console.error('Error removing the contact');
              return;
            }
            // Perform animation (remove element from list)
          }
        );
      });
    },

    getContact: function() {
      return new Promise(resolve => {
        ContactsService.get(this._uuid, contact => {
          resolve(contact);
        });
      });
    },

    set uuid(value) {
      this._uuid = value;
    },

    get uuid() {
      return this._uuid;
    }
  };
})(window);
