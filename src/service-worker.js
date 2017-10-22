// Replacements are implemented by `/scripts/sw-generate.js`
// PREFETCH_URLS: URL[]
// APP_VERSION: number
// FALLBACK_DOCUMENT: string
// NODE_ENV: string

const CURRENT_CACHES = {
  prefetch: `prefetch-v-APP_VERSION`,
  api: `api-v-APP_VERSION`,
};

const FAKE_UUID = '10111';

async function prefetch(cacheName, urls) {
  try {
    const cache = await caches.open(cacheName);
    return urls.forEach(
      await async function(url) {
        const response = await fetch(new Request(new URL(url, location.href)));
        if (response.status >= 400) {
          throw new Error(`request for ${url} failed with status ${response.statusText}`);
        }

        return cache.put(url, response);
      },
    );
  } catch (error) {
    console.error(`Unable to cache ${urls}.`);
  }
}

self.addEventListener('install', event => {
  if (NODE_ENV !== 'production') {
    console.log(`Install, prefetch: PREFETCH_URLS`);
  }

  event.waitUntil(await prefetch(CURRENT_CACHES.prefetch, PREFETCH_URLS));
});

self.addEventListener('activate', event => {
  const expectedCacheNames = Object.keys(CURRENT_CACHES).map(key => {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(async () => {
    const cacheNames = await caches.keys();
    return Promise.all(
      cacheNames.map(async cacheName => {
        if (expectedCacheNames.indexOf(cacheName) === -1) {
          // If this cache name isn't present in the array of "expected" cache names, then delete it.
          if (NODE_ENV !== 'production') {
            console.log(`Deleting out of date cache: ${cacheName}`);
          }
          return await caches.delete(cacheName);
        }
      }),
    );
  });
});

self.addEventListener('fetch', event => {
  if (NODE_ENV !== 'production') {
    console.log(`Fetch event for ${event.request.url}`);
  }

  event.respondWith(
    (async function() {
      try {
        const match = await caches.match(event.request);
        if (match) {
          if (NODE_ENV !== 'production') {
            console.log(`Found response in cache: ${match}`);
          }
          return match;
        }

        if (NODE_ENV !== 'production') {
          console.log('No response found in cache.');
        }
        if (event.request.mode === 'navigate') {
          // This is a navigate request for a document.
          // We need to deliver /shell as the response.
          const fallbackDocument = await caches.match(FALLBACK_DOCUMENT);
          if (fallbackDocument) {
            if (NODE_ENV !== 'production') {
              console.log('Navigation request, and fallbackDocument is cached, delvering.');
            }
            return fallbackDocument;
          }
        }

        if (NODE_ENV !== 'production') {
          console.log('Making Network Request.');
        }

        // TODO: This is cache only responses for all API requests.
        // This needs to be cacheFirst only for /api/list
        // networkFirst needs to be used for /api/details
        if (/api/.test(event.request.url)) {
          // This is a cacheable api request.
          const clonedRequest = event.request.clone();
          // Clone the request, since each fetch consumes the request object.
          const response = await fetch(clonedRequest);
          if (response.status < 400) {
            // If a valid response, then cache the contents for future usage.
            const apiCache = await caches.open(CURRENT_CACHES.api);
            apiCache.put(event.request, response.clone());
          }
          return response;
        }

        return await fetch(event.request);
      } catch (error) {
        console.error(`Fetching failed: ${error}`);
        throw error;
      }
    })(),
  );
});

self.addEventListener('message', event => {
  if (NODE_ENV !== 'production') {
    console.log(`Handling message event: ${event}`);
  }
  event.waitUntil(async () => {
    const cache = await caches.open(CURRENT_CACHES.api);
    switch (event.data.command) {
      case 'uuidUpdate':
        // Delete all the cache entries for older uuids.
        const matches = await cache.matchAll(/api\/list/);
        await Promise.all(matches.forEach(async element => await cache.delete(element)));

        // Pre-fetch the first page for all types with new uuid.
        return await prefetch(CURRENT_CACHES.api, [`/api/list/top?from=0&to=29`]);
      default:
        throw Error(`Unknown command: ${event.data.command}`);
    }
  });
});
