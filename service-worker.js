// Define a name for the cache
const CACHE_NAME = 'online-checker-cache-v1';

// List the files to be cached on installation
// We cache the main page and the CDN for Tailwind CSS.
const urlsToCache = [
  './', // Represents the root path, usually the main HTML file
  'https://cdn.tailwindcss.com'
];

// Install event: triggered when the service worker is first installed.
self.addEventListener('install', event => {
  // We extend the install event until the caching is complete.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: triggered for every network request made by the page.
self.addEventListener('fetch', event => {
  event.respondWith(
    // Check if the request exists in the cache.
    caches.match(event.request)
      .then(response => {
        // If the response is found in the cache, return it.
        if (response) {
          return response;
        }
        // If not found in cache, fetch it from the network.
        return fetch(event.request);
      }
    )
  );
});
