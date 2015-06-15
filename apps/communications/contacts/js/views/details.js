'use strict';

(function(exports) {

  var contacts = window.contacts || {};

  var DetailsBasic = function DetailsBasic() {
    this.isAFavoriteChange = false;

    utils.listeners.add({
      '#toggle-favorite': this.toggleFavorite.bind(this)
    });
  };

  DetailsBasic.prototype = Object.create(window.Details.prototype);

   // readOnly tells us if we should allow editing the rendered contact.
  DetailsBasic.prototype.render =
    function cd_render(currentContact, fbContactData, readOnly) {
    if(this.isAFavoriteChange){
      this.isAFavoriteChange = false;
      return Promise.resolve(this.isAFavoriteChange);
    }

    this.contactData = currentContact || this.contactData;

    this.isFbContact = fb.isFbContact(this.contactData);
    this.isFbLinked = fb.isFbLinked(this.contactData);

    // Initially enabled and only disabled if necessary
    this.editContactButton.removeAttribute('disabled');

    if (readOnly) {
      this.editContactButton.classList.add('hide');
      this.header.setAttribute('action', 'close');
      this.socialTemplate.classList.add('hide');
    } else {
      this.editContactButton.classList.remove('hide');
      this.header.setAttribute('action', 'back');
      this.socialTemplate.classList.remove('hide');
    }

    if (!fbContactData && this.isFbContact) {
      var fbContact = new fb.Contact(this.contactData);
      var req = fbContact.getData();

      req.onsuccess = () => {
        this.doReloadContactDetails(req.result);
      };

      req.onerror = () => {
        window.console.error('FB: Error while loading FB contact data');
        this.doReloadContactDetails(this.contactData);
      };
    } else {
      this.doReloadContactDetails(fbContactData || this.contactData);
    }
  };

  DetailsBasic.prototype.doReloadContactDetails = function(contact) {
    this.detailsNameText.textContent = this.getDisplayName(contact);
    this.contactDetails.classList.remove('no-photo');
    this.contactDetails.classList.remove('fb-contact');
    this.contactDetails.classList.remove('up');
    utils.dom.removeChildNodes(this.listContainer);

    this.renderFavorite(contact);
    //renderOrg(contact);

    //ContactsButtons.renderPhones(contact);
    //ContactsButtons.renderEmails(contact);

    //renderWebrtcClient(contactData);// Don't share the FB info

    //renderAddresses(contact);

    //renderDates(contact);

    //renderNotes(contact);
    if (fb.isEnabled) {
      //renderSocial(contact);
    }

    if (!fb.isFbContact(contact) || fb.isFbLinked(contact)) {
      //renderDuplicate(contact);
    }

    this.renderPhoto(contact);
  };

  DetailsBasic.prototype.renderFavorite = function(contact) {
    var favorite = this.isFavorite(contact);
    this.toggleFavoriteMessage(favorite);

    this.header.classList.toggle('favorite', !!favorite);
  };

  DetailsBasic.prototype.toggleFavoriteMessage = function(isFav) {
    var cList = this.favoriteMessage.classList;
    var l10nId = isFav ? 'removeFavorite' : 'addFavorite';
    this.favoriteMessage.setAttribute('data-l10n-id', l10nId);
    isFav ? cList.add('on') : cList.remove('on');
  };

  DetailsBasic.prototype.toggleFavorite = function() {
    var contact = this.contactData;
    var self = this;

    var favorite = !this.isFavorite(contact);
    this.toggleFavoriteMessage(favorite);
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

    // Disabling button while saving the contact
    this.favoriteMessage.style.pointerEvents = 'none';

    var promise = new Promise(function(resolve, reject) {
      ContactsService.save(
        utils.misc.toMozContact(contact),
        function(e) {
          if (e) {
            self.favoriteMessage.style.pointerEvents = 'auto';
            console.error('Error saving favorite');
            reject('Error saving favorite');
            resolve(false);
            return;
          }

          self.isAFavoriteChange = true;
          /*
             Two contacts are returned because the enrichedContact is readonly
             and if the Contact is edited we need to prevent saving
             FB data on the mozContacts DB.
          */

          ContactsService.get(
            contact.id,
            function onSuccess(savedContact, enrichedContact) {
              self.renderFavorite(savedContact);
              self.setContact(savedContact);
              self.favoriteMessage.style.pointerEvents = 'auto';
            },
            function onError() {
              console.error('Error reloading contact');
              self.favoriteMessage.style.pointerEvents = 'auto';
            }
          );
          resolve(self.isAFavoriteChange);
        }
      );
    }).then();

    return promise;
  };

  DetailsBasic.prototype.renderPhoto = function(contact) {
    this.contactDetails.classList.remove('up');
    if (this.isFbContact) {
      this.contactDetails.classList.add('fb-contact');
    }

    var photo = ContactPhotoHelper.getFullResolution(contact);
    if (photo) {
      var currentHash = this.cover.dataset.imgHash;
      if (!currentHash) {
        utils.dom.updatePhoto(photo, this.cover);
        this.updateHash(photo, this.cover);
      }
      else {
        // Need to recalculate the hash and see whether the images changed
        thus.calculateHash(photo, newHash => {
          if (currentHash !== newHash) {
            utils.dom.updatePhoto(photo, this.cover);
            this.cover.dataset.imgHash = newHash;
          }
          else {
            // Only for testing purposes
            this.cover.dataset.photoReady = 'true';
          }
        });
      }

      this.contactDetails.classList.add('up');
      this.cover.classList.add('translated');
      this.contactDetails.classList.add('translated');
      var clientHeight = this.contactDetails.clientHeight -
          (this.initMargin * 10 * SCALE_RATIO);
      if (this.detailsInner.offsetHeight < clientHeight) {
        this.cover.style.overflow = 'hidden';
      } else {
        this.cover.style.overflow = 'auto';
      }
    } else {
      this.resetPhoto();
    }
  };

  DetailsBasic.prototype.resetPhoto = function() {
    this.cover.classList.remove('translated');
    this.contactDetails.classList.remove('translated');
    this.cover.style.backgroundImage = '';
    this.cover.style.overflow = 'auto';
    this.contactDetails.style.transform = '';
    this.contactDetails.classList.add('no-photo');
    this.cover.dataset.imgHash = '';
  };


  contacts.Details = new DetailsBasic();

})(window);