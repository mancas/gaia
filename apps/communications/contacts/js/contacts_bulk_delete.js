/* globals utils, contactsRemover, Promise,
   Search, ConfirmDialog, Loader */
'use strict';

var contacts = window.contacts || {};

contacts.BulkDelete = (function() {

  var cancelled = false;

  /**
   * Loads the overlay class before showing
   */
  function requireOverlay(callback) {
    Loader.utility('Overlay', callback);
  }

  // Shows a dialog to confirm the bulk delete
  var showConfirm = function showConfirm(n) {
    return new Promise(function doShowConfirm(resolve, reject) {
      var cancelObject = {
        title: 'cancel',
        callback: function onCancel() {
          ConfirmDialog.hide();
          reject();
        }
      };

      var removeObject = {
        title: 'delete',
        isDanger: true,
        callback: function onRemove() {
          ConfirmDialog.hide();
          resolve();
        }
      };

      ConfirmDialog.show(null,
        {'id': 'ContactConfirmDel', 'args': {n: n}}, cancelObject,
          removeObject);
    });
  };

  var doDelete = function doDelete(ids, done) {
    cancelled = false;
    var progress = utils.overlay.show('DeletingContacts', 'progressBar',
      null, true);
    progress.setTotal(ids.length);

    utils.overlay.oncancel = function() {
      cancelled = true;
      contactsRemoverObj.finish();
    };

    var contactsRemoverObj = new contactsRemover();
    contactsRemoverObj.init(ids, function onInitDone() {
      contactsRemoverObj.start();
    });

    contactsRemoverObj.onDeleted = function onDeleted(currentId) {
      if (window.Search && Search.isInSearchMode()) {
        Search.invalidateCache();
        Search.removeContact(currentId);
      }
      contacts.List.remove(currentId);
      progress.update();
    };

    contactsRemoverObj.onError = function onError() {
      utils.overlay.hide();
      utils.status.show({
        id: 'deleteError-general'
      });
      contacts.Settings.refresh();
    };

    contactsRemoverObj.onFinished = function onFinished() {
      utils.overlay.hide();
      utils.status.show({
        id: 'DeletedTxt',
        args: {n: contactsRemoverObj.getDeletedCount()}
      });
      contacts.Settings.refresh();

      if (typeof done === 'function') {
        done();
      }
    };

    contactsRemoverObj.onCancelled = contactsRemoverObj.onFinished;

  };
  // Start the delete of the contacts
  var performDelete = function performDelete(promise, done) {
    requireOverlay(function onOverlay() {
      promise.onsuccess = function onSuccess(ids) {
        showConfirm(ids.length).then(
                          contacts.BulkDelete.doDelete.bind(null, ids, done));
      };
    });
  };

  return {
    'performDelete': performDelete,
    'doDelete': doDelete
  };

})();
