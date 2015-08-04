(function(exports) {
  'use strict';

  function clickHandler(uuid) {
    console.info('awesome!');
    window.location.href = ParamUtils.generateUrl('detail', {contact: uuid});
  }

  exports.ListController = {
    'init': function init() {
      window.addEventListener('itemClicked', this.onItemClick);
    },
    'onItemClick': function onItemClick(evt) {
      console.info(evt, new Error().stack);
      if (evt.detail && evt.detail.uuid) {
        clickHandler(evt.detail.uuid);
      }
    }
  };
})(window);