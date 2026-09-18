/* =========================================================
   MRS WOLFIE BOXING APP
   SERVICE WORKER
   PWA CACHE + FIREBASE CLOUD MESSAGING
========================================================= */


/* =========================================================
   FIREBASE CLOUD MESSAGING
========================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);


firebase.initializeApp({

  apiKey:
    "AIzaSyC06RDrqpXodbYBJqyeGvRkmtxQGapaaPY",

  authDomain:
    "team-wolfpack-app.firebaseapp.com",

  databaseURL:
    "https://team-wolfpack-app-default-rtdb.europe-west1.firebasedatabase.app",

  projectId:
    "team-wolfpack-app",

  storageBucket:
    "team-wolfpack-app.firebasestorage.app",

  messagingSenderId:
    "1070414578856",

  appId:
    "1:1070414578856:web:df14e7d387e658eeae2e9d",

  measurementId:
    "G-6JTCE2N9LZ"

});


const messaging =
  firebase.messaging();



/* =========================================================
   FIREBASE BACKGROUND MESSAGES
========================================================= */

messaging.onBackgroundMessage(
  (payload) => {

    console.log(
      "[Mrs Wolfie] Background notification received:",
      payload
    );


    const data =
      payload.data || {};


    const notification =
      payload.notification || {};


    const title =
      notification.title ||
      data.title ||
      "MRS WOLFIE";


    const body =
      notification.body ||
      data.body ||
      "A new Mrs Wolfie update is available.";


    const targetURL =
      data.url ||
      "./updates.html";


    /*
      If Firebase supplied a notification payload,
      browser notification handling may already occur.

      For data-only messages, create the notification here.
    */

    if (
      !payload.notification
    ) {

      return self.registration.showNotification(
        title,
        {
          body: body,

          icon:
            "./images/icon-192.png",

          badge:
            "./images/icon-192.png",

          tag:
            data.tag ||
            "mrs-wolfie-update",

          renotify:
            true,

          data: {
            url:
              targetURL
          }
        }
      );

    }

  }
);



/* =========================================================
   NOTIFICATION CLICK
========================================================= */

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();


    const targetURL =
      event.notification.data?.url ||
      "./index.html";


    const absoluteURL =
      new URL(
        targetURL,
        self.registration.scope
      ).href;


    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })

        .then(
          async (clientList) => {

            for (
              const client
              of clientList
            ) {

              if (
                "navigate" in client
              ) {

                await client.navigate(
                  absoluteURL
                );

              }


              if (
                "focus" in client
              ) {

                return client.focus();

              }

            }


            if (
              clients.openWindow
            ) {

              return clients.openWindow(
                absoluteURL
              );

            }

          }
        )

    );

  }
);



/* =========================================================
   CACHE VERSION
========================================================= */

const CACHE_NAME =
  "mrs-wolfie-boxing-v9";



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

  "./notifications.js",

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

            const cachedPage =
              await caches.match(
                event.request
              );


            if (
              cachedPage
            ) {

              return cachedPage;

            }


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
