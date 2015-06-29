'use strict';

(function(exports) {
  function Controller() {
    this._activity = null;
  }

  Controller.prototype = {
    get activity() {
      return _activity;
    },

    set activity(value) {
      _activity = value;
    }
  };

  exports.Controller = Controller;
})(window);