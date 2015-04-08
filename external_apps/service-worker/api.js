'use strict';

(function(exports) {
  var root = (function () {
    var root = new URL(
      document.currentScript.dataset.root || '',
      window.location.origin
    ).href;
    return root.endsWith('/') ? root : root + '/';
  }());

  var workerURL =
    root + (document.currentScript.dataset.worker || 'worker.js');

  exports.connect = function connect(url) {
    console.log('MANU', root, workerURL);
    if (!'serviceWorker' in navigator) {
      console.error('MANU - Your browser does not support SW');
      return;
    }

    console.log('MANU - SW is being registered');
    navigator.serviceWorker.register(workerURL, {
      scope: root
    }).then(function(registration) {
      console.log('MANU', registration);
    }).catch(function(why) {
      console.log('MANU', why);
    });
  };

}(window.navigator));