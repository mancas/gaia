(function(exports) {
  'use strict';

  /**
   * Loads required libraries for sim import
   */
  var requireSimImport = function(callback) {
    var libraries = ['Overlay', 'Import_sim_contacts'];
    var pending = libraries.length;

    libraries.forEach(function onPending(library) {
      Loader.utility(library, next);
    });

    function next() {
      if (!(--pending)) {
        callback();
      }
    }
  };

  // Import contacts from SIM card and updates ui
  var onSimImport = function(iccId, done) {
  	console.info("Sim Import");
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
    	console.info("finish");
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
          window.setTimeout(requireOverlay.bind(this, Import.onSdImport), 0);
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

  var doExport = function(strategy) {
    // Launch the selection mode in the list, and then invoke
    // the export with the selected strategy.

    contacts.List.selectFromList(_('exportContactsAction'),   //TODO: Go to list.
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
            'numFilteredContacts': 0
          }
        ]
      }
    );
  };

  function resetWait(wakeLock) {
    Contacts.hideOverlay();
    if (wakeLock) {
      wakeLock.unlock();
    }
  }

  exports.Import = {
    'onSimImport': onSimImport,
    'onSdImport': onSdImport,
    'requireSimImport': requireSimImport,
    'doExport': doExport
  };
}(window));