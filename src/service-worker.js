// Replacements are implemented by `/scripts/sw-generate.js`
// PREFETCH_URLS: URL[]
// APP_VERSION: number
// FALLBACK_DOCUMENT: string
// NODE_ENV: string
// NETWORK_FIRST_PATTERN: RegExp
// CACHE_FIRST_PATTERN: RegExp
// STATIC_PRECACHED_PATTERN: RegExp

const CURRENT_CACHES = {
  prefetch: `prefetch-v-APP_VERSION`,
  runtime: `runtime-v-APP_VERSION`,
};

async function prefetch(cacheName, urls) {
  try {
    const cache = await caches.open(cacheName);

    for (const index in urls) {
      const url = urls[index];
      const response = await fetch(new Request(new URL(url, location.href)));

      if (response.status >= 400) {
        throw new Error(`request for ${url} failed with status ${response.statusText}`);
      }
      await cache.put(url, response);
    }
  } catch (error) {
    console.error(`Unable to cache ${urls}.`);
  }
  return;
}

self.addEventListener('install', event => {
  if (NODE_ENV !== 'production') {
    console.log(`Install, prefetch: PREFETCH_URLS`);
  }

  event.waitUntil(prefetch(CURRENT_CACHES.prefetch, PREFETCH_URLS));
});

self.addEventListener('activate', event => {
  const expectedCacheNames = Object.keys(CURRENT_CACHES).map(key => {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    (async function() {
      await clients.claim();

      const cacheNames = await caches.keys();
      for (const index in cacheNames) {
        const cacheName = cacheNames[index];
        if (!expectedCacheNames.includes(cacheName)) {
          if (NODE_ENV !== 'production') {
            console.log(`Deleting out of date cache: ${cacheName}`);
          }
          await caches.delete(cacheName);
        }
      }
    })(),
  );
});

async function cacheFetch(url) {
  const cached = await caches.match(url);
  if (cached) {
    if (NODE_ENV !== 'production') {
      console.log(`cacheFetch url:${url} – IS cached, delvering.`);
    }
    return cached;
  }
  return null;
}
async function networkFetch(event, {cacheName = CURRENT_CACHES.runtime, overrideCacheName = null, cacheable = true}) {
  // Clone the request, since each fetch consumes the request object.
  const clonedRequest = event.request.clone();
  const response = await fetch(clonedRequest);
  if (response.ok && cacheable) {
    // If a valid response, then cache the contents for future usage.
    const runtimeCache = await caches.open(cacheName);
    runtimeCache.put(overrideCacheName || event.request, response.clone());
  }

  return response;
}
async function cacheFirstFetch(
  event,
  {cacheName = CURRENT_CACHES.runtime, overrideCacheName = null, cacheable = true},
) {
  // In a cache first fetch, check the cache and deliver a response
  const cached = await cacheFetch(overrideCacheName || event.request.url);
  if (cached !== null) {
    if (NODE_ENV !== 'production') {
      console.log(
        `cacheFirstFetch url: ${event.request.url}, overrideCacheName: ${overrideCacheName} – IS cached, delivering.`,
      );
    }
    return cached;
  }

  // If the request was not present in the cache, we need to retrieve it from the network.
  if (NODE_ENV !== 'production') {
    console.log(
      `cacheFirstFetch url: ${event.request
        .url}, overrideCacheName: ${overrideCacheName} – NOT cached, network request.`,
    );
  }

  return await networkFetch(event, {cacheName, overrideCacheName, cacheable});
}
async function networkFirstFetch(
  event,
  {cacheName = CURRENT_CACHES.runtime, overrideCacheName = null, cacheable = true},
) {
  const networkResponse = await networkFetch(event, {cacheName, overrideCacheName, cacheable});

  if (networkResponse.ok) {
    return networkResponse;
  }

  // Reponse did not complete for some reason, attempt to fulfill from cache.
  const cached = await cacheFetch(url);
  if (cached !== null) {
    return cached;
  }

  return response;
}

self.addEventListener('fetch', event => {
  if (NODE_ENV !== 'production') {
    console.log(`Fetch event for ${event.request.url}`);
  }

  event.respondWith(
    (async function() {
      try {
        const {mode, url} = event.request;

        if (mode === 'navigate') {
          // Navigation requests override the cache key to always use the shell document.
          return await cacheFirstFetch(event, {
            cacheName: CURRENT_CACHES.prefetch,
            overrideCacheName: FALLBACK_DOCUMENT,
          });
        } else if (STATIC_PRECACHED_PATTERN.test(url)) {
          return await cacheFirstFetch(event, {cacheName: CURRENT_CACHES.prefetch});
        } else if (CACHE_FIRST_PATTERN.test(url)) {
          return await cacheFirstFetch(event, {cacheName: CURRENT_CACHES.runtime});
        } else if (NETWORK_FIRST_PATTERN.test(url)) {
          await networkFirstFetch(event, {cacheName: CURRENT_CACHES.runtime});
        }

        // Network only requests.
        return await networkFetch(event, {cacheName: CURRENT_CACHES.runtime});
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
      case 'uuid-update':
        // Delete all the cache entries for older uuids.
        const matches = await cache.matchAll(/api\/list/);
        matches.forEach(
          await async function(element) {
            return await cache.delete(element);
          },
        );

        // Pre-fetch the first page for all types with new uuid.
        return await prefetch(CURRENT_CACHES.api, [`/api/list/top?uuid=${event.data.uuid}&from=0&to=29`]);
      default:
        throw Error(`Unknown command: ${event.data.command}`);
    }
  });
});
