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

    this.photoPos = 7;
    this.initMargin = 8;


    this.initListeners();
    this.initPullEffect(this.cover);
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

  Details.prototype.initPullEffect = function(cover) {
    var maxPosition = Math.round(150 * SCALE_RATIO);
    var startPosition = 0;
    var self = this;

    function onTouchStart(e) {
      if (self.contactDetails.classList.contains('no-photo')) {
        return;
      }
      e.preventDefault();
      startPosition = e.changedTouches[0].clientY;

      self.contactDetails.classList.add('up');
      self.cover.classList.add('up');

      window.addEventListener('touchmove', onTouchMove, true);
      window.addEventListener('touchend', onTouchEnd, true);
    }

    function onTouchEnd(e) {
      e.preventDefault();

      self.contactDetails.style.transform = null;
      self.contactDetails.classList.add('up');

      self.cover.style.transform = null;
      self.cover.classList.add('up');

      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('touchend', onTouchEnd, true);
    }

    function onTouchMove(e) {
      e.preventDefault();

      var deltaY = e.changedTouches[0].clientY - startPosition;
      deltaY = Math.min(maxPosition, Math.max(0, deltaY));

      var calc = 'calc(' + self.initMargin + 'rem + ' + deltaY + 'px)';
      self.contactDetails.style.transform = 'translateY(' + calc + ')';
      self.contactDetails.classList.remove('up');

      // Divide by 40 (4 times slower and in rems)
      var coverPosition = (-self.photoPos + (deltaY / 40)) + 'rem';
      self.cover.style.transform = 'translateY(' + coverPosition + ')';
      self.cover.classList.remove('up');
    }

    self.cover.addEventListener('touchstart', onTouchStart, true);
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

  Details.prototype.calculateHash = function(photo, cb) {
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

  Details.prototype.updateHash = function(photo, cover) {
    this.calculateHash(photo, hash => {
      this.cover.dataset.imgHash = hash;
    });
  };

  exports.Details = Details;

})(window);

