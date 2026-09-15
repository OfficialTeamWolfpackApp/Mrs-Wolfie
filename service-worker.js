/* =========================================================
   MRS WOLFIE BOXING APP
   SERVICE WORKER
========================================================= */


/* =========================================================
   CACHE VERSION

   Increase this version whenever the core app structure
   changes significantly.
========================================================= */

const CACHE_NAME =
  "mrs-wolfie-boxing-v3";



/* =========================================================
   CORE APP FILES
========================================================= */

const APP_FILES = [

  "./",

  "./index.html",

  "./fight.html",

  "./profile.html",

  "./schedule.html",

  "./fight-data.js",

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
      Activate this service worker immediately
      rather than waiting for the old worker.
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
      Immediately control existing app windows.
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
       CENTRAL FIGHT DATA

       NETWORK FIRST
    ====================================================== */

    /*
      fight-data.js is deliberately handled differently
      from ordinary static assets.

      Every time the app opens, it attempts to retrieve
      the newest fight database from GitHub.

      If the user is offline, the most recently cached
      copy is used instead.

      This means future fight updates do NOT require us
      to change the service-worker cache number every time.
    */

    if (
      requestURL.pathname.endsWith(
        "/fight-data.js"
      )
    ) {


      event.respondWith(


        fetch(
          event.request,
          {
            cache: "no-store"
          }
        )


          .then(
            (networkResponse) => {


              if (
                networkResponse &&
                networkResponse.ok
              ) {


                const responseCopy =
                  networkResponse.clone();


                caches
                  .open(
                    CACHE_NAME
                  )

                  .then(
                    (cache) => {


                      cache.put(
                        event.request,
                        responseCopy
                      );


                    }
                  );


              }


              return networkResponse;


            }
          )


          .catch(
            () => {


              return caches.match(
                event.request
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

    if (
      event.request.mode ===
      "navigate"
    ) {


      event.respondWith(


        fetch(
          event.request
        )


          .then(
            (networkResponse) => {


              const responseCopy =
                networkResponse.clone();


              caches
                .open(
                  CACHE_NAME
                )

                .then(
                  (cache) => {


                    cache.put(
                      event.request,
                      responseCopy
                    );


                  }
                );


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
       OTHER FILES

       CACHE FIRST
    ====================================================== */

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
                (networkResponse) => {


                  if (
                    !networkResponse ||
                    networkResponse.status !== 200
                  ) {


                    return networkResponse;


                  }



                  const responseCopy =
                    networkResponse.clone();



                  caches
                    .open(
                      CACHE_NAME
                    )

                    .then(
                      (cache) => {


                        cache.put(
                          event.request,
                          responseCopy
                        );


                      }
                    );


                  return networkResponse;


                }
              );


          }
        )


    );


  }
);
