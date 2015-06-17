'use strict';

/* global utils */
/* global ExtServices */
/* global ContactsService */

/* exported Details */

(function(exports) {

  var _activity = null;

  var setActivity = function(activity) {
    _activity = activity;
  };

  var findDuplicate = function(contactId) {
    ExtServices.match(contactId);
  };

  var toggleFavorite = function(contact){
    var favorite = !isFavorite(contact);
    if (favorite) {
      contact.category = contact.category || [];
      contact.category.push('favorite');
    } else {
      if (!contact.category) {
        return;
      }
      var pos = contact.category.indexOf('favorite');
      if (pos > -1) {
        contact.category.splice(pos, 1);
      }
    }

  var promise = new Promise(function(resolve, reject) {
      ContactsService.save(
        utils.misc.toMozContact(contact),
        function(e) {
          if (e) {
            console.error('Error saving favorite');
            reject('Error saving favorite');
            resolve(false);
            return;
          }

          /*
             Two contacts are returned because the enrichedContact is readonly
             and if the Contact is edited we need to prevent saving
             FB data on the mozContacts DB.
          */

          ContactsService.get(
            contact.id,
            function onSuccess(savedContact, enrichedContact) {
              resolve(savedContact);
            },
            function onError() {
              console.error('Error reloading contact');
              resolve(false);
            }
          );
        }
      );
    }).then();

    return promise;
  };

  var isFavorite = function isFavorite(contact) {
    return contact != null && contact.category != null &&
              contact.category.indexOf('favorite') != -1;
  };

  var init = function init(activity) {
    if (typeof activity !== 'undefined') {
      setActivity(activity);
    }
  };

  var getCount = function getCount() {
    return new Promise((resolve, reject) => {
      ContactsService.getCount(resolve);
    });
  };

  var shareContact = function shareContact(contact) {
    const VCARD_DEPS = [
      '/shared/js/text_normalizer.js',
      '/shared/js/contact2vcard.js',
      '/shared/js/setImmediate.js'
    ];

    LazyLoader.load(VCARD_DEPS,function vcardLoaded() {
      ContactToVcardBlob([contact], function blobReady(vcardBlob) {
        var filename = VcardFilename(contact);
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
  };

  var handleBackAction = function handleBackAction(evt) {
    if (_activity) {
      _activity.postResult({});
    } else {
      window.history.back();
    }
  };

  var calculateHash = function calculateHash(photo, cb) {
    var START_BYTES = 127;
    var BYTES_HASH = 16;

    var out = [photo.type, photo.size];

    // We skip the first bytes that typically are headers
    var chunk = photo.slice(START_BYTES, START_BYTES + BYTES_HASH);
    var reader = new FileReader();
    reader.onloadend = function() {
      out.push(reader.result);
      cb(out.join(''));
    };
    reader.onerror = function() {
      window.console.error('Error while calculating the hash: ',
                           reader.error.name);
      cb(out.join(''));
    };
    reader.readAsDataURL(chunk);
  };

  exports.Details = {
    'init': init,
    'findDuplicate': findDuplicate,
    'toggleFavorite': toggleFavorite,
    'isFavorite': isFavorite,
    'setActivity': setActivity,
    'getCount': getCount,
    'shareContact': shareContact,
    'handleBackAction': handleBackAction,
    'calculateHash': calculateHash
  };
})(window);