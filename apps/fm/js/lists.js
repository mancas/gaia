'use strict';
/* global mozFMRadio, UIManager, $, $$ */
/* exported HistoryList, FavoritesList */
var HistoryList = {

  _HistoryList: [],

  /**
   * Storage key name.
   * @const
   * @type {string}
   */
  KEYNAME: 'historylist',

  /**
   * Maximum size of the history
   * @const
   * @type {integer}
   */
  SIZE: 1,

  init: function hl_init(callback) {
    var self = this;
    window.asyncStorage.getItem(this.KEYNAME, function storage_getItem(value) {
      self._HistoryList = value || [];
      if (typeof callback == 'function') {
        callback();
      }
    });
  },

  _save: function hl_save() {
    window.asyncStorage.setItem(this.KEYNAME, this._HistoryList);
  },

  /**
   * Add frequency to history list.
   *
   * @param {freq} frequency to add.
   */
  add: function hl_add(freq) {
    if (freq == null) {
      return;
    }
    var self = this;
    self._HistoryList.push({
      name: freq + '',
      frequency: freq
    });
    if (self._HistoryList.length > self.SIZE) {
      self._HistoryList.shift();
    }
    self._save();
  },

  /**
   * Get the last frequency tuned
   *
   * @return {freq} the last frequency tuned.
   */
  last: function hl_last() {
    if (this._HistoryList.length === 0) {
      return null;
    }
    else {
      return this._HistoryList[this._HistoryList.length - 1];
    }
  }

};

var FavoritesList = {
  _favList: null,

  KEYNAME: 'favlist',

  init: function(callback) {
    var self = this;
    window.asyncStorage.getItem(this.KEYNAME, function storage_getItem(value) {
      self._favList = value || { };
      self._showListUI();

      if (typeof callback == 'function') {
        callback();
      }
    });

    UIManager.favListContainer.addEventListener('click',
      function _onclick(event) {
        var frequency = self._getElemFreq(event.target);
        if (!frequency) {
          return;
        }

        if (event.target.classList.contains('fav-list-remove-button')) {
          // Remove the item from the favorites list.
          self.remove(frequency);
          UIManager.updateFreqUI();
        } else {
          if (mozFMRadio.enabled) {
            UIManager.cancelSeekAndSetFreq(frequency);
          } else {
            // If fm is disabled, turn the radio on.
            UIManager.enableFMRadio(frequency);
          }
        }
    });
  },

  _save: function() {
    window.asyncStorage.setItem(this.KEYNAME, this._favList);
  },

  _showListUI: function() {
    var self = this;
    this.forEach(function(f) {
      self._addItemToListUI(f);
    });
  },

  _addItemToListUI: function(item) {
    var container = UIManager.favListContainer;
    var elem = document.createElement('div');
    elem.id = this._getUIElemId(item);
    elem.className = 'fav-list-item';
    elem.setAttribute('role', 'option');
    var html = '';
    html += '<div class="fav-list-frequency">';
    html += item.frequency.toFixed(1);
    html += '</div>';
    html += '<div class="fav-list-remove-button"></div>';
    elem.innerHTML = html;

    // keep list ascending sorted
    if (container.childNodes.length === 0) {
      container.appendChild(elem);
    } else {
      var childNodes = container.childNodes;
      for (var i = 0; i < childNodes.length; i++) {
        var child = childNodes[i];
        var elemFreq = this._getElemFreq(child);
        if (item.frequency < elemFreq) {
          container.insertBefore(elem, child);
          break;
        } else if (i == childNodes.length - 1) {
          container.appendChild(elem);
          break;
        }
      }
    }

    return elem;
  },

  _removeItemFromListUI: function(freq) {
    if (!this.contains(freq)) {
      return;
    }

    var itemElem = $(this._getUIElemId(this._favList[freq]));
    if (itemElem) {
      itemElem.parentNode.removeChild(itemElem);
    }
  },

  _getUIElemId: function(item) {
    return 'frequency-' + item.frequency;
  },

  _getElemFreq: function(elem) {
    var isParentListItem = elem.parentNode.classList.contains('fav-list-item');
    var listItem = isParentListItem ? elem.parentNode : elem;
    return parseFloat(listItem.id.substring(listItem.id.indexOf('-') + 1));
  },

  forEach: function(callback) {
    for (var freq in this._favList) {
      callback(this._favList[freq]);
    }
  },

  /**
   * Check if frequency is in fav list.
   *
   * @param {number} frequence to check.
   *
   * @return {boolean} True if freq is in fav list.
   */
  contains: function(freq) {
    if (!this._favList) {
      return false;
    }
    return typeof this._favList[freq] != 'undefined';
  },

  /**
   * Add frequency to fav list.
   */
  add: function(freq) {
    if (!this.contains(freq)) {
      this._favList[freq] = {
        name: freq + '',
        frequency: freq
      };

      this._save();

      // show the item in favorites list.
      this._addItemToListUI(this._favList[freq]).scrollIntoView();
    }
  },

  /**
   * Remove frequency from fav list.
   *
   * @param {number} freq to remove.
   *
   * @return {boolean} True if freq to remove is in fav list.
   */
  remove: function(freq) {
    var exists = this.contains(freq);
    this._removeItemFromListUI(freq);
    delete this._favList[freq];
    this._save();
    return exists;
  },

  select: function(freq) {
    var items = $$('#fav-list-container div.fav-list-item');
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (this._getElemFreq(item) == freq) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', true);
      } else {
        item.classList.remove('selected');
        item.setAttribute('aria-selected', false);
      }
    }
  }
};
