/* =========================================================
   MRS WOLFIE BOXING APP
   SERVICE WORKER
========================================================= */

const CACHE_NAME =
  "mrs-wolfie-boxing-v2";


/* =========================================================
   CORE APP FILES
========================================================= */

const APP_FILES = [

  "./",

  "./index.html",

  "./fight.html",

  "./profile.html",

  "./schedule.html",

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
        .open(CACHE_NAME)

        .then(
          (cache) => {

            return cache.addAll(
              APP_FILES
            );

          }
        )

    );


    /*
      Activate the new service worker
      without waiting for the old one.
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
      Immediately control any open
      Mrs Wolfie app windows.
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
      Only handle normal GET requests.
    */

    if (
      event.request.method !==
      "GET"
    ) {

      return;

    }



    /*
      HTML / PAGE NAVIGATION

      Network first means the app checks
      GitHub for the newest page.

      If there is no internet connection,
      it falls back to the cached version.
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
            (networkResponse) => {


              const responseCopy =
                networkResponse.clone();


              caches
                .open(CACHE_NAME)

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



    /*
      IMAGES / ICONS / OTHER FILES

      Use cached copy first for speed.

      If it is not cached, retrieve it
      from the network and save it.
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
                (networkResponse) => {


                  /*
                    Do not cache failed
                    network responses.
                  */

                  if (
                    !networkResponse ||
                    networkResponse.status !== 200
                  ) {

                    return networkResponse;

                  }



                  const responseCopy =
                    networkResponse.clone();



                  caches
                    .open(CACHE_NAME)

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
