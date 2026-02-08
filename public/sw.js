// Service worker disabled - no caching
// This file exists for PWA manifest requirements but does not cache anything

// Install event - do nothing, just activate immediately
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event - only intercept same-origin requests, let API requests pass through
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't intercept API requests or cross-origin requests
  // Let the browser handle them normally to avoid CORS issues
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/food-') ||
      url.pathname.startsWith('/purchase') ||
      url.pathname.startsWith('/quantity-types') ||
      url.pathname.startsWith('/survey-') ||
      url.pathname.startsWith('/consumption-') ||
      url.pathname.startsWith('/admin/') ||
      url.origin !== self.location.origin) {
    // Let API and cross-origin requests pass through without interception
    return;
  }
  
  // For same-origin static assets, pass through to network
  event.respondWith(fetch(event.request));
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



