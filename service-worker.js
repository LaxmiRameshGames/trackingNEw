// service-worker.js
const CACHE_NAME = 'location-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css'
];

// Service worker installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Service worker activation
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Handle background sync events
self.addEventListener('sync', event => {
  if (event.tag === 'sendLocations') {
    event.waitUntil(sendPendingLocations());
  }
});

// Send any pending locations that failed to send while offline
async function sendPendingLocations() {
  // Open the database to get pending locations
  const pendingLocations = JSON.parse(localStorage.getItem('pendingLocations') || '[]');
  const SERVER_URL = 'https://your-server-url.com/api/location';
  
  // Send each pending location
  const sendPromises = pendingLocations.map(locationData => {
    return fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(locationData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to send location');
      }
      return response;
    });
  });
  
  // Wait for all pending locations to be sent
  try {
    await Promise.all(sendPromises);
    // Clear sent locations
    localStorage.setItem('pendingLocations', '[]');
    console.log('All pending locations sent successfully');
  } catch (error) {
    console.error('Error sending pending locations:', error);
    // We'll try again later
    return Promise.reject(error);
  }
}

// Fetch event - use cache-first strategy
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});