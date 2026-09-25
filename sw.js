/* Network-first cache so a later edit is what you see. Offline falls back to the last good copy. */
var CACHE = 'lc-shell-2';

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll([
      './',
      './index.html',
      './css/app.css',
      './js/app.js',
      './js/solar3d.js',
      './js/viz-host.js',
      './js/viz-planet.js',
      './js/viz-hole.js',
      './js/viz-scale.js',
      './js/viz-galaxy.js',
      './js/viz-delay.js',
      './js/graphs.js',
      './js/audio.js',
      './js/search.js',
      './js/file-fallback.js',
      './data/bodies.json',
      './data/topics.json',
      './data/copy.json',
      './manifest.webmanifest',
      './assets/svg/icon.svg',
      './assets/svg/wordmark.svg',
      './assets/svg/icons.svg'
    ]);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    if (res.ok) {
      caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
    }
    return res;
  }).catch(function () {
    return caches.match(req);
  }));
});
