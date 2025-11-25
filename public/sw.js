// Service worker disabled - no caching
// This file exists for PWA manifest requirements but does not cache anything

// Install event - do nothing, just activate immediately
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - don't intercept, let all requests pass through to network
self.addEventListener('fetch', (event) => {
  // Do nothing - let browser handle all requests normally
  // This ensures no caching and no interference with asset loading
  return;
});

// Activate event - clean up all old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL caches to ensure clean state
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});



