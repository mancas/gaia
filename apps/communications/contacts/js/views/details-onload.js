'use strict';

window.onload = function() {
  //document.body.classList.add('animate-in');
  var background = document.querySelector('.background');
  background.classList.add('fade-out');
  background.addEventListener('animationend', function fn() {
    background.removeEventListener('animationend', fn);
    background.style.display = 'none';
  });

  // Add listener to the 'back' button
  document.getElementById('details-view-header').addEventListener(
    'action',
    function() {
      window.history.back();
    }
  );
};