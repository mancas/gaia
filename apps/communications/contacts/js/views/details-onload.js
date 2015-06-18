'use strict';

window.onload = function() {
  var overlay = document.querySelector('.overlay');
  overlay.classList.add('fade-out');
  overlay.addEventListener('animationend', function fn() {
    overlay.removeEventListener('animationend', fn);
    overlay.style.display = 'none';
  });

  // Add listener to the 'back' button
  document.getElementById('details-view-header').addEventListener(
    'action',
    function() {
      window.history.back();
    }
  );
};