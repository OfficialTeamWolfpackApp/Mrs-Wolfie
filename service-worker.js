/* =========================================================
   MRS WOLFIE BOXING APP
   SERVICE WORKER
========================================================= */


/* =========================================================
   CACHE VERSION
========================================================= */

const CACHE_NAME =
  "mrs-wolfie-boxing-v5";



/* =========================================================
   CORE APP FILES
========================================================= */

const APP_FILES = [

  "./",

  "./index.html",

  "./fight.html",

  "./profile.html",

  "./schedule.html",

  "./updates.html",

  "./fight-data.js",

  "./updates-data.js",

  "./manifest.json",

  "./images/icon-192.png",

  "./images/icon-512.png",

  "./images/icon-maskable-512.png",

  "./images/ChatGPT Image Aug 13, 2026, 03_53_18 PM.png"

];



/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  (event) => {


    event.waitUntil(


      caches
        .open(
          CACHE_NAME
        )

        .then(
          (cache) => {


            return cache.addAll(
              APP_FILES
            );


          }
        )


    );


    /*
      Activate the newest service worker immediately.
    */

    self.skipWaiting();


  }
);



/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  (event) => {


    event.waitUntil(


      caches
        .keys()

        .then(
          (cacheNames) => {


            return Promise.all(


              cacheNames.map(
                (cacheName) => {


                  if (
                    cacheName !==
                    CACHE_NAME
                  ) {


                    return caches.delete(
                      cacheName
                    );


                  }


                }
              )


            );


          }
        )


    );


    /*
      Immediately control open Mrs Wolfie app windows.
    */

    self.clients.claim();


  }
);



/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  (event) => {


    /*
      Only intercept GET requests.
    */

    if (
      event.request.method !==
      "GET"
    ) {


      return;


    }



    const requestURL =
      new URL(
        event.request.url
      );



    /* =====================================================
       CENTRAL APP DATABASES

       NETWORK FIRST
    ====================================================== */

    /*
      Both central databases are handled network-first:

      fight-data.js
      updates-data.js

      When online:
      - request the newest version
      - save that version into the PWA cache
      - return the newest version to the app

      When offline:
      - use the most recently cached copy

      This means normal fight/news changes do not require
      another service-worker cache-version change.
    */

    const isCentralDataFile =

      requestURL.pathname.endsWith(
        "/fight-data.js"
      )

      ||

      requestURL.pathname.endsWith(
        "/updates-data.js"
      );



    if (
      isCentralDataFile
    ) {


      event.respondWith(


        fetch(
          event.request,
          {
            cache: "no-store"
          }
        )


          .then(
            async (networkResponse) => {


              if (
                networkResponse &&
                networkResponse.ok
              ) {


                const responseCopy =
                  networkResponse.clone();


                const cache =
                  await caches.open(
                    CACHE_NAME
                  );


                await cache.put(
                  event.request,
                  responseCopy
                );


              }


              return networkResponse;


            }
          )


          .catch(
            async () => {


              const cachedResponse =
                await caches.match(
                  event.request
                );


              if (
                cachedResponse
              ) {


                return cachedResponse;


              }


              /*
                Normally this should never be reached because
                both database files are pre-cached during
                installation.
              */

              return new Response(
                "",
                {
                  status: 503,
                  statusText: "Offline"
                }
              );


            }
          )


      );


      return;


    }



    /* =====================================================
       HTML PAGE NAVIGATION

       NETWORK FIRST
    ====================================================== */

    /*
      Main app pages use network-first.

      When online:
      - load the newest page
      - update its cached copy

      When offline:
      - use the previously cached page

      If that specific page has never been cached,
      fall back to the Home page.
    */

    if (
      event.request.mode ===
      "navigate"
    ) {


      event.respondWith(


        fetch(
          event.request
        )


          .then(
            async (networkResponse) => {


              if (
                networkResponse &&
                networkResponse.ok
              ) {


                const responseCopy =
                  networkResponse.clone();


                const cache =
                  await caches.open(
                    CACHE_NAME
                  );


                await cache.put(
                  event.request,
                  responseCopy
                );


              }


              return networkResponse;


            }
          )


          .catch(
            async () => {


              const cachedPage =
                await caches.match(
                  event.request
                );


              if (
                cachedPage
              ) {


                return cachedPage;


              }


              return caches.match(
                "./index.html"
              );


            }
          )


      );


      return;


    }



    /* =====================================================
       OTHER APP FILES

       CACHE FIRST
    ====================================================== */

    /*
      Images, icons, manifest and other static assets
      use cache-first for faster loading.

      If an asset is not already cached, retrieve it
      from the network and save it for future use.
    */

    event.respondWith(


      caches
        .match(
          event.request
        )

        .then(
          (cachedResponse) => {


            if (
              cachedResponse
            ) {


              return cachedResponse;


            }



            return fetch(
              event.request
            )


              .then(
                async (networkResponse) => {


                  if (
                    !networkResponse ||
                    networkResponse.status !== 200
                  ) {


                    return networkResponse;


                  }



                  const responseCopy =
                    networkResponse.clone();


                  const cache =
                    await caches.open(
                      CACHE_NAME
                    );


                  await cache.put(
                    event.request,
                    responseCopy
                  );


                  return networkResponse;


                }
              );


          }
        )


    );


  }
);
