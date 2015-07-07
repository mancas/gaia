'use strict';
/* global _ */
/* global ConfirmDialog */
/* global Contacts */
/* global ContactsBTExport */
/* global ContactsExporter */
/* global ContactsSDExport */
/* global ContactsSIMExport */
/* global fb */
/* global IccHandler */
/* global LazyLoader */
/* global Rest */
/* global SimContactsImporter */
/* global SimDomGenerator */
/* global utils */
/* global VCFReader */
/* global ContactsService */
/* global ExtServices */
/* global SettingsUI */
/* global contacts */
/* global Controller */

(function(exports) {
  var orderByLastName,
    newOrderByLastName = null,
    PENDING_LOGOUT_KEY = 'pendingLogout';

    var EXPORT_TRANSITION_LEVEL = 2, DELETE_TRANSITION_LEVEL = 1;

  // Initialise the settings screen (components, listeners ...)
  var init = function initialize() {
    // Create the DOM for our SIM cards and listen to any changes
    IccHandler.init(new SimDomGenerator(), SettingsUI.cardStateChanged);
  };

  // Get the different values that we will show in the app
  var getData = function getData() {
    var config = utils.cookie.load();
    var order = config ? config.order : false;
    orderByLastName = order;
    newOrderByLastName = null;
    SettingsUI.updateOrderingUI();
  };

  var checkNoContacts = function() {
    return new Promise((resolve, reject) => {
      ContactsService.isEmpty(function(error, isEmpty) {
        if (error) {
          reject(error);
        } else {
          resolve(isEmpty);
        }
      });
    });
  };

  // Given an event, select wich should be the targeted
  // import/export source
  var getSource = function(e) {
    var source = e.target.parentNode.dataset.source;
    // Check special cases
    if (source && source.indexOf('-') != -1) {
      source = source.substr(0, source.indexOf('-'));
    }
    return source;
  };

  var importOptionsHandler = function(e) {
    /* jshint validthis:true */

    var source = getSource(e);
    switch (source) {
      case 'sim':
        var iccId = e.target.parentNode.dataset.iccid;
        window.setTimeout(requireSimImport.bind(this,
          onSimImport.bind(this, iccId)), 0);
        break;
      case 'sd':
        window.setTimeout(requireOverlay.bind(this, onSdImport), 0);
        break;
      case 'gmail':
        ExtServices.importGmail();
        break;
      case 'live':
        ExtServices.importLive();
        break;
    }
  };

  var exportOptionsHandler = function(e) {
    var source = getSource(e);
    switch (source) {
      case 'sim':
        var iccId = e.target.parentNode.dataset.iccid;
        LazyLoader.load(['/contacts/js/export/sim.js'],
          function() {
            doExport(new ContactsSIMExport(IccHandler.getIccById(iccId)));
          }
        );
        break;
      case 'sd':
        LazyLoader.load(
          [
            '/shared/js/device_storage/get_storage_if_available.js',
            '/shared/js/device_storage/get_unused_filename.js',
            '/shared/js/contact2vcard.js',
            '/shared/js/setImmediate.js',
            '/contacts/js/export/sd.js'
          ],
          function() {
            doExport(new ContactsSDExport());
          }
        );
        break;
      case 'bluetooth':
        LazyLoader.load(
          [
            '/shared/js/device_storage/get_storage_if_available.js',
            '/shared/js/device_storage/get_unused_filename.js',
            '/shared/js/contact2vcard.js',
            '/shared/js/setImmediate.js',
            '/contacts/js/export/bt.js'
          ],
          function() {
            doExport(new ContactsBTExport());
          }
        );
        break;
    }
  };

  var doExport = function(strategy) {
    // Launch the selection mode in the list, and then invoke
    // the export with the selected strategy.

    // We need to know the number of FB contacts in the device to filter them
    // out properly.
    var numFbContactsReq = fb.utils.getNumFbContacts();

    numFbContactsReq.onsuccess = function() {
      openSelectList(numFbContactsReq.result);
    };

    numFbContactsReq.onerror = function() {
      openSelectList(0);
      console.error('Number of fb contacts in device could not be retrieved',
        numFbContactsReq.error && numFbContactsReq.error.name);
    };

    function openSelectList(numFilteredContacts) {
      contacts.List.selectFromList(_('exportContactsAction'),
        function onSelectedContacts(promise) {
          // Resolve the promise, meanwhile show an overlay to
          // warn the user of the ongoin operation, dismiss it
          // once we have the result
          requireOverlay(function _loaded() {
            utils.overlay.show('preparing-contacts', null, 'spinner');
            promise.onsuccess = function onSuccess(ids) {
              // Once we start the export process we can exit from select mode
              // This will have to evolve once export errors can be captured
              contacts.List.exitSelectMode();
              var exporter = new ContactsExporter(strategy);
              exporter.init(ids, function onExporterReady() {
                // Leave the contact exporter to deal with the overlay
                exporter.start();
              });
            };
            promise.onerror = function onError() {
              contacts.List.exitSelectMode();
              utils.overlay.hide();
            };
          });
        },
        null,
        SettingsUI.navigationHandler,
        {
          isDanger: false,
          transitionLevel: EXPORT_TRANSITION_LEVEL,
          filterList: [
            {
              'containerClass': 'disable-fb-items',
              'numFilteredContacts': numFilteredContacts
            }
          ]
        }
      );
    }
  };

  /**
   * Loads the overlay class before showing
   */
  var requireOverlay = function(callback) {
    Contacts.utility('Overlay', callback, Contacts.SHARED_UTILITIES);
  };

  /**
   * Loads required libraries for sim import
   */
  var requireSimImport = function(callback) {
    var libraries = ['Overlay', 'Import_sim_contacts'];
    var pending = libraries.length;

    libraries.forEach(function onPending(library) {
      Contacts.utility(library, next, Contacts.SHARED_UTILITIES);
    });

    function next() {
      if (!(--pending)) {
        callback();
      }
    }
  };

  // Import contacts from SIM card and updates ui
  var onSimImport = function(iccId, done) {
    var icc = IccHandler.getIccById(iccId);
    if (icc === null) {
      return;
    }
    var progress = Contacts.showOverlay('simContacts-reading',
      'activityBar');

    var wakeLock = navigator.requestWakeLock('cpu');

    var cancelled = false, contactsRead = false;
    var importer = new SimContactsImporter(icc);
    utils.overlay.showMenu();
    utils.overlay.oncancel = function oncancel() {
      cancelled = true;
      importer.finish();
      if (contactsRead) {
        // A message about canceling will be displayed while the current chunk
        // is being cooked
        progress.setClass('activityBar');
        utils.overlay.hideMenu();
        progress.setHeaderMsg('messageCanceling');
      } else {
        importer.onfinish(); // Early return while reading contacts
      }
    };
    var totalContactsToImport;
    var importedContacts = 0;
    // Delay for showing feedback to the user after importing
    var DELAY_FEEDBACK = 200;

    importer.onread = function import_read(n) {
      contactsRead = true;
      totalContactsToImport = n;
      if (totalContactsToImport > 0) {
        progress.setClass('progressBar');
        progress.setHeaderMsg('simContacts-importing');
        progress.setTotal(totalContactsToImport);
      }
    };

    importer.onfinish = function import_finish(numDupsMerged) {
      window.setTimeout(function onfinish_import() {
        resetWait(wakeLock);
        if (importedContacts > 0) {
          var source = 'sim-' + iccId;
          utils.misc.setTimestamp(source, function() {
            // Once the timestamp is saved, update the list
            window.dispatchEvent(new CustomEvent('contactsimportdone'));
          });
        }
        if (!cancelled) {
          utils.status.show({
            id: 'simContacts-imported3',
            args: {
              n: importedContacts
            }
          },
          !numDupsMerged ? null : {
            id: 'contactsMerged',
            args: {
              numDups: numDupsMerged
            }
          });
        }

        typeof done === 'function' && done();

      }, DELAY_FEEDBACK);

      importer.onfinish = null;
    };

    importer.onimported = function imported_contact() {
      importedContacts++;
      if (!cancelled) {
        progress.update();
      }
    };

    importer.onerror = function import_error() {
      var cancel = {
        title: 'cancel',
        callback: function() {
          ConfirmDialog.hide();
        }
      };
      var retry = {
        title: 'retry',
        isRecommend: true,
        callback: function() {
          ConfirmDialog.hide();
          // And now the action is reproduced one more time
          window.setTimeout(requireSimImport.bind(this,
            onSimImport.bind(this, iccId)), 0);
        }
      };
      ConfirmDialog.show(null, 'simContacts-error', cancel, retry);
      resetWait(wakeLock);
    };

    importer.start();
  };

  var onSdImport = function(cb) {
    var cancelled = false;
    var importer = null;
    var progress = Contacts.showOverlay(
      'memoryCardContacts-reading', 'activityBar');
    utils.overlay.showMenu();
    utils.overlay.oncancel = function() {
      cancelled = true;
      importer ? importer.finish() : Contacts.hideOverlay();
    };
    var wakeLock = navigator.requestWakeLock('cpu');

    var importedContacts = 0;
    // Delay for showing feedback to the user after importing
    var DELAY_FEEDBACK = 200;

    utils.sdcard.retrieveFiles([
      'text/vcard',
      'text/x-vcard',
      'text/directory;profile=vCard',
      'text/directory'
    ], ['vcf', 'vcard'], function(err, fileArray) {
      if (err) {
        return import_error(err, cb);
      }

      if (cancelled) {
        return;
      }

      if (fileArray.length) {
        utils.sdcard.getTextFromFiles(fileArray, '', onFiles);
      } else {
        import_error('No contacts were found.', cb);
      }
    });

    function onFiles(err, text) {
      if (err) {
        return import_error(err, cb);
      }

      if (cancelled) {
        return;
      }

      importer = new VCFReader(text);
      if (!text || !importer) {
        return import_error('No contacts were found.', cb);
      }

      importer.onread = import_read;
      importer.onimported = imported_contact;
      importer.onerror = import_error;

      importer.process(function import_finish(total, numDupsMerged) {
        window.setTimeout(function onfinish_import() {
          utils.misc.setTimestamp('sd', function() {
            // Once the timestamp is saved, update the list
            window.dispatchEvent(new CustomEvent('contactsimportdone'));
            resetWait(wakeLock);

            if (!cancelled) {
              var msg1 = {
                id: 'memoryCardContacts-imported3',
                args: {
                  n: importedContacts
                }
              };
              var msg2 = !numDupsMerged ? null : {
                id: 'contactsMerged',
                args: {
                  numDups: numDupsMerged
                }
              };

              utils.status.show(msg1, msg2);

              if (typeof cb === 'function') {
                cb();
              }
            }
          });
        }, DELAY_FEEDBACK);
      });
    }

    function import_read(n) {
      progress.setClass('progressBar');
      progress.setHeaderMsg('memoryCardContacts-importing');
      progress.setTotal(n);
    }

    function imported_contact() {
      importedContacts++;
      progress.update();
    }

    function import_error(e, cb) {
      var cancel = {
        title: 'cancel',
        callback: function() {
          ConfirmDialog.hide();
        }
      };

      var retry = {
        title: 'retry',
        isRecommend: true,
        callback: function() {
          ConfirmDialog.hide();
          // And now the action is reproduced one more time
          window.setTimeout(requireOverlay.bind(this, onSdImport), 0);
        }
      };
      ConfirmDialog.show(null, 'memoryCardContacts-error', cancel,
        retry);
      resetWait(wakeLock);
      if (typeof cb === 'function') {
        cb();
      }
    }
  };

  function resetWait(wakeLock) {
    Contacts.hideOverlay();
    if (wakeLock) {
      wakeLock.unlock();
    }
  }

  var bulkDeleteHandler = function bulkDeleteHandler() {
    LazyLoader.load(
      [
        '/contacts/js/contacts_bulk_delete.js',
        '/contacts/js/contacts_remover.js'
      ],
      function() {
        Contacts.view('search', function() {
          contacts.List.selectFromList(_('DeleteTitle'),
            function onSelectedContacts(promise, done) {
              contacts.BulkDelete.performDelete(promise, done);
            },
            null,
            SettingsUI.navigationHandler,
            {
              transitionLevel: DELETE_TRANSITION_LEVEL
            }
          );
        }, Contacts.SHARED_CONTACTS);
      }
    );
  };

  function saveStatus(data) {
    window.asyncStorage.setItem(PENDING_LOGOUT_KEY, data);
  }

  var automaticLogout = function() {
    if (navigator.offLine === true) {
      return;
    }

    LazyLoader.load(['/shared/js/contacts/utilities/http_rest.js'],
    function() {
      window.asyncStorage.getItem(PENDING_LOGOUT_KEY, function(data) {
        if (!data) {
          return;
        }
        var services = Object.keys(data);
        var numResponses = 0;

        services.forEach(function(service) {
          var url = data[service];

          var callbacks = {
            success: function logout_success() {
              numResponses++;
              window.console.log('Successfully logged out: ', service);
              delete data[service];
              if (numResponses === services.length) {
                saveStatus(data);
              }
            },
            error: function logout_error() {
              numResponses++;
              if (numResponses === services.length) {
                saveStatus(data);
              }
            },
            timeout: function logout_timeout() {
              numResponses++;
              if (numResponses === services.length) {
                saveStatus(data);
              }
            }
          };
          Rest.get(url, callbacks);
        });
      });
    });
  };

  function Settings() {
    Controller.call(this);
  }

  Settings.prototype = {
    'init': init,
    'getData': getData,
    'checkNoContacts': checkNoContacts,
    'importOptionsHandler': importOptionsHandler,
    'exportOptionsHandler': exportOptionsHandler,
    'bulkDeleteHandler': bulkDeleteHandler,
    'automaticLogout': automaticLogout,
    get orderByLastName() {
      return orderByLastName;
    },
    set orderByLastName(value) {
      orderByLastName = value;
    },
    get newOrderByLastName() {
      return newOrderByLastName;
    },
    set newOrderByLastName(value) {
      newOrderByLastName = value;
    }
  };

  exports.Settings = new Settings();

})(window);
