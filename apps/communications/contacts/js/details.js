'use strict';

(function(exports) {
  var Details = function Details() {};

  Details.prototype.init = function(currentDom) {
    var dom = currentDom || document;
    this.header = dom.querySelector('#details-view-header');
    this.contactDetails = dom.querySelector('#contact-detail');
    this.listContainer = dom.querySelector('#details-list');
    this.detailsName = dom.querySelector('#contact-name-title');
    this.detailsNameText = dom.querySelector('#contact-name-title bdi');
    this.orgTitle = dom.querySelector('#org-title');
    this.datesTemplate = dom.querySelector('#dates-template-\\#i\\#');
    this.addressesTemplate = dom.querySelector('#address-details-template-\\#i\\#');
    this.socialTemplate = dom.querySelector('#social-template-\\#i\\#');
    this.duplicateTemplate = dom.querySelector('#duplicate-contacts-template');
    this.editContactButton = dom.querySelector('#edit-contact-button');
    this.cover = dom.querySelector('#cover-img');
    this.detailsInner = dom.querySelector('#contact-detail-inner');
    this.favoriteMessage = dom.querySelector('#toggle-favorite');
    this.notesTemplate = dom.querySelector('#note-details-template-\\#i\\#');
    this.isFbContact = false;
    this.isFbLinked = false;
    this.contactData = null;
    this._ = navigator.mozL10n.get;


    this.initListeners();
  };

  Details.prototype.initListeners = function() {
    window.addEventListener('online', this.checkOnline);
    window.addEventListener('offline', this.checkOnline);
  };

  Details.prototype.checkOnline = function() {
    var socialTemplate = document.querySelector(
                                        ':not([data-template])[data-social]');

    if (socialTemplate && !this.isFbContact) {
      this.doDisableButton(socialTemplate.querySelector('#link_button'));
    }
  };

  Details.prototype.doDisableButton = function(buttonElement) {
    if (navigator.onLine === true) {
      buttonElement.removeAttribute('disabled');
    }
    else {
      buttonElement.setAttribute('disabled', 'disabled');
    }
  };

  // Fills the contact data to display if no givenName and familyName
  Details.prototype.getDisplayName = function(contact) {
    var name = this._('noName');

    if (this.hasName(contact)) {
      name = contact.name[0];
    } else if (this.hasContent(contact.tel)) {
      name = contact.tel[0].value;
    } else if (this.hasContent(contact.email)) {
      name = contact.email[0].value;
    }
    return name;
  };

  Details.prototype.hasContent = function(field) {
    return (Array.isArray(field) &&
            field.length > 0 &&
            field[0].value &&
            field[0].value.trim());
  };

  Details.prototype.hasName = function(contact) {
    return (Array.isArray(contact.name) &&
            contact.name[0] &&
            contact.name[0].trim());
  };

  Details.prototype.isFavorite = function(contact) {
    return contact != null && contact.category != null &&
              contact.category.indexOf('favorite') != -1;
  };

  Details.prototype.setContact = function(currentContact) {
    this.contactData = currentContact;
  };

  exports.Details = Details;

})(window);

