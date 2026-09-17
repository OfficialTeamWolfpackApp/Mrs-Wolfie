/* =========================================================
   MRS WOLFIE BOXING APP
   SERVICE WORKER
========================================================= */


/* =========================================================
   CACHE VERSION
========================================================= */

const CACHE_NAME =
  "mrs-wolfie-boxing-v7";



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
      Do not leave the new service worker waiting.

      Activate it as soon as installation succeeds.
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


                  return Promise.resolve();


                }
              )

            );


          }
        )

        .then(
          () => {

            /*
              Immediately take control of existing
              Mrs Wolfie app windows.
            */

            return self.clients.claim();

          }
        )

    );


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
    ====================================================== */

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

        (async () => {


          try {


            /*
              Add a unique query value to the NETWORK
              request.

              This helps prevent an intermediate browser,
              PWA or hosting cache from returning an older
              copy of the central database.
            */

            const freshURL =
              new URL(
                event.request.url
              );


            freshURL.searchParams.set(
              "_mrswolfie",
              Date.now().toString()
            );



            const networkResponse =
              await fetch(
                freshURL.toString(),
                {
                  method: "GET",
                  cache: "no-store",
                  credentials: "same-origin",
                  redirect: "follow"
                }
              );



            if (
              !networkResponse ||
              !networkResponse.ok
            ) {

              throw new Error(
                "Central database network request failed."
              );

            }



            /*
              Save the newest response against the NORMAL
              request URL.

              This is important because offline requests
              will still ask for:

              fight-data.js
              updates-data.js

              without the temporary cache-busting value.
            */

            const cache =
              await caches.open(
                CACHE_NAME
              );


            await cache.put(
              event.request,
              networkResponse.clone()
            );



            return networkResponse;


          }


          catch (error) {


            /*
              Offline or network problem.

              Use the most recently cached database.
            */

            const cachedResponse =
              await caches.match(
                event.request
              );


            if (
              cachedResponse
            ) {

              return cachedResponse;

            }



            return new Response(
              "",
              {
                status: 503,
                statusText: "Offline"
              }
            );


          }


        })()

      );


      return;


    }



    /* =====================================================
       HTML PAGE NAVIGATION
    ====================================================== */

    if (
      event.request.mode ===
      "navigate"
    ) {


      event.respondWith(

        (async () => {


          try {


            /*
              Navigation is network-first.

              cache: no-store helps installed PWAs request
              the newest HTML when they are online.
            */

            const networkResponse =
              await fetch(
                event.request,
                {
                  cache: "no-store"
                }
              );



            if (
              networkResponse &&
              networkResponse.ok
            ) {


              const cache =
                await caches.open(
                  CACHE_NAME
                );


              await cache.put(
                event.request,
                networkResponse.clone()
              );


            }



            return networkResponse;


          }


          catch (error) {


            /*
              First try the exact requested page.
            */

            const cachedPage =
              await caches.match(
                event.request
              );


            if (
              cachedPage
            ) {

              return cachedPage;

            }



            /*
              Final offline fallback = Home.
            */

            const cachedHome =
              await caches.match(
                "./index.html"
              );


            if (
              cachedHome
            ) {

              return cachedHome;

            }



            return new Response(
              "Mrs Wolfie App is currently offline.",
              {
                status: 503,
                headers: {
                  "Content-Type":
                    "text/plain; charset=utf-8"
                }
              }
            );


          }


        })()

      );


      return;


    }



    /* =====================================================
       OTHER STATIC APP FILES
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
                async (networkResponse) => {


                  if (
                    !networkResponse ||
                    networkResponse.status !== 200
                  ) {

                    return networkResponse;

                  }



                  /*
                    Only cache same-origin resources.
                  */

                  if (
                    requestURL.origin ===
                    self.location.origin
                  ) {


                    const cache =
                      await caches.open(
                        CACHE_NAME
                      );


                    await cache.put(
                      event.request,
                      networkResponse.clone()
                    );


                  }



                  return networkResponse;


                }
              );


          }
        )

    );


  }
);
