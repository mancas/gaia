'use strict';

(function(exports) {
  function Controller() {
    this._activity = null;
  }

  Controller.prototype = {
    get activity() {
      return this._activity;
    },

    set activity(value) {
      this._activity = value;
    }
  };

  exports.Controller = Controller;
})(window);