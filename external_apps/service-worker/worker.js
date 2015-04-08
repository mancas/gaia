'use strict';

var CACHE_NAME = 'cache-v1';

console.log('MANU - Offliner running!', typeof self);

self.addEventListener('install', function(event) {
  console.log('MANU - Installation complete', event);
  /*
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Offliner > Opened cache');
        importScripts('offliner-resources.js');
        return Promise.all(resources.map(url => {
          var bustedUrl = url + '?__b=' + Date.now();

          var request = new Request(bustedUrl, { mode: 'no-cors' });

          // But when caching, the cache is for the original URL.
          return fetch(request).then(response => {
            if (response && response.status === 200) {
              console.log('Offliner cached >', url);
              cache.put(url, response);
            }
          });
        }));
      })
  );
  */
});

self.addEventListener('activate', function(event) {
  console.log('MANU - Offliner has been activated!');
});
