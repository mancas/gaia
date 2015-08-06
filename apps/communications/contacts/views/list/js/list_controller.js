(function(exports) {
  'use strict';
  var _activity;

  function pick(evt) {
    if (_activity) {
      _activity.postResult(evt.detail.contact);
    }
  }

  function onItemClick(evt) {
    if (evt.detail && evt.detail.uuid) {
      clickHandler(evt.detail.uuid);
    }
  }

  function clickHandler(uuid) {
    console.info('awesome!');
    window.location.href = ParamUtils.generateUrl('detail', {contact: uuid});
  }

  exports.ListController = {
    'init': function init() {
      window.addEventListener('itemClicked', onItemClick);
      window.addEventListener('pickAction', pick);
    },
    'setActivity': function setActivity(activity) {
      _activity = activity;
    }
  };
})(window);