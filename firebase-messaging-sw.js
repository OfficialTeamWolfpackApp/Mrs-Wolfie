/* =========================================================
   MRS WOLFIE BOXING APP
   FIREBASE CLOUD MESSAGING SERVICE WORKER
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIGURATION
========================================================= */

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


/* =========================================================
   FIREBASE CLOUD MESSAGING
========================================================= */

const messaging =
  firebase.messaging();


/* =========================================================
   BACKGROUND NOTIFICATIONS
========================================================= */

messaging.onBackgroundMessage(
  (payload) => {

    console.log(
      "[Mrs Wolfie] Background notification received:",
      payload
    );


    /*
      Firebase messages may provide notification information
      in either payload.notification or payload.data.
    */

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


    const options = {

      body: body,

      icon:
        "./images/icon-192.png",

      badge:
        "./images/icon-192.png",

      tag:
        data.tag ||
        "mrs-wolfie-update",

      renotify: true,

      data: {
        url: targetURL
      }

    };


    return self.registration.showNotification(
      title,
      options
    );

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


    event.waitUntil(

      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true
        })

        .then(
          (clientList) => {

            /*
              If Mrs Wolfie is already open,
              focus that app window and navigate it.
            */

            for (
              const client of clientList
            ) {

              if (
                "focus" in client
              ) {

                if (
                  "navigate" in client
                ) {

                  client.navigate(
                    targetURL
                  );

                }

                return client.focus();

              }

            }


            /*
              Otherwise open the Mrs Wolfie app.
            */

            if (
              clients.openWindow
            ) {

              return clients.openWindow(
                targetURL
              );

            }

          }
        )

    );

  }
);
