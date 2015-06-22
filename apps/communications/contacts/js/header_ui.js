'use strict';

(function(exports) {
  const SELECT_MODE_CLASS = {
    'pick' : {
      'text/vcard' : ['disable-fb-items']
    }
  };

  exports.HeaderUI = {
    _lastCustomHeaderCallback: null,

    init: function() {
      this.settings = document.getElementById('view-settings');
      this.settingsButton = document.getElementById('settings-button');
      this.header = document.getElementById('contacts-list-header');
      this.addButton = document.getElementById('add-contact-button');
      this.editModeTitleElement = document.getElementById('edit-title');
      this.appTitleElement = document.getElementById('app-title');
    },

    setSelectModeClass: function(element, activityName, activityType) {
      var classesByType = SELECT_MODE_CLASS[activityName] || {};
      activityType = Array.isArray(activityType) ? activityType :
        [activityType];
      activityType.forEach(function(type) {
        var classesToAdd = classesByType[type];
        if (classesToAdd) {
          element.classList.add.apply(element.classList, classesToAdd);
        }
      });
    },

    setupActionableHeader: function() {
      this.header.removeAttribute('action');
      this.settingsButton.hidden = false;
      this.addButton.hidden = false;

      this.appTitleElement.setAttribute('data-l10n-id', 'contacts');
    },

    setCancelableHeader: function(cb, titleId) {
      this.setupCancelableHeader(titleId);
      this.header.removeEventListener('action', this.handleCancel);
      this._lastCustomHeaderCallback = cb;
      this.header.addEventListener('action', cb);
    },

    setNormalHeader: function() {
      this.setupActionableHeader();
      this.header.removeEventListener('action', this._lastCustomHeaderCallback);
      this.header.addEventListener('action', this.handleCancel);
    },

    setupCancelableHeader: function(alternativeTitle) {
      this.header.setAttribute('action', 'close');
      this.settingsButton.hidden = true;
      this.addButton.hidden = true;
      if (alternativeTitle) {
        this.appTitleElement.setAttribute('data-l10n-id', alternativeTitle);
      }
      // Trigger the title to re-run font-fit/centering logic
      this.appTitleElement.textContent = this.appTitleElement.textContent;
    },

    handleCancel: function() {
      //If in an activity, cancel it
      if (ActivityHandler.currentlyHandling) {
        ActivityHandler.postCancel();
        MainNavigation.home();
      } else {
        MainNavigation.back();
      }
    },

    updateSelectCountTitle: function(count) {
      navigator.mozL10n.setAttributes(this.editModeTitleElement,
                                      'SelectedTxt',
                                      {n: count});
    },

    hideAddButton: function() {
      this.addButton.classList.add('hide');
    }
  };

  exports.HeaderUI.init();
})(window);