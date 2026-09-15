const CACHE_NAME = "mrs-wolfie-boxing-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./fight.html",
  "./profile.html",
  "./schedule.html",
  "./manifest.json",
  "./images/ChatGPT Image Aug 13, 2026, 03_53_18 PM.png"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener("install", (event) => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_FILES);
      })
  );

  self.skipWaiting();

});


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener("activate", (event) => {

  event.waitUntil(

    caches
      .keys()
      .then((cacheNames) => {

        return Promise.all(

          cacheNames.map((cacheName) => {

            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

          })

        );

      })

  );

  self.clients.claim();

});


/* =========================================================
   FETCH
========================================================= */

self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .then((networkResponse) => {

        const responseCopy =
          networkResponse.clone();

        caches
          .open(CACHE_NAME)
          .then((cache) => {

            cache.put(
              event.request,
              responseCopy
            );

          });

        return networkResponse;

      })

      .catch(() => {

        return caches.match(event.request);

      })

  );

});
