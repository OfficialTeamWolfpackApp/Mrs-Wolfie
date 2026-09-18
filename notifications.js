/* =========================================================
   MRS WOLFIE BOXING APP
   PUSH NOTIFICATIONS
========================================================= */

const MRS_WOLFIE_VAPID_KEY =
  "BFiQ3IfeNlorv_csTQPN0qD7MKDu-98GjjPzxL7x5AK3sJmxlZyA6dGpDD9uEUpkxWlNZv4jQ37QdnvRTQckRrg";


const MRS_WOLFIE_FIREBASE_CONFIG = {

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

};


/* =========================================================
   START NOTIFICATION SYSTEM
========================================================= */

(async function () {

  console.log(
    "Mrs Wolfie notification script loaded."
  );


  /* =======================================================
     BASIC BROWSER SUPPORT
  ======================================================== */

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {

    console.log(
      "Mrs Wolfie notifications are not supported by this browser."
    );

    return;

  }


  try {

    /* =====================================================
       LOAD FIREBASE
    ====================================================== */

    const firebaseAppModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"
      );


    const firebaseMessagingModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js"
      );


    const {
      initializeApp,
      getApps,
      getApp
    } = firebaseAppModule;


    const {
      getMessaging,
      isSupported,
      register,
      onRegistered,
      onMessage
    } = firebaseMessagingModule;


    /* =====================================================
       CHECK FIREBASE MESSAGING SUPPORT
    ====================================================== */

    const messagingSupported =
      await isSupported();


    if (!messagingSupported) {

      console.log(
        "Firebase Cloud Messaging is not supported by this browser."
      );

      return;

    }


    /* =====================================================
       FIREBASE APP
    ====================================================== */

    const app =
      getApps().length
        ? getApp()
        : initializeApp(
            MRS_WOLFIE_FIREBASE_CONFIG
          );


    const messaging =
      getMessaging(app);


    /* =====================================================
       RECEIVE FIREBASE INSTALLATION ID
    ====================================================== */

    onRegistered(
      messaging,
      function (installationId) {

        console.log(
          "Mrs Wolfie notification installation registered:",
          installationId
        );


        localStorage.setItem(
          "mrsWolfieFirebaseInstallationId",
          installationId
        );


        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieNotificationRegistered",
            {
              detail: {
                installationId:
                  installationId
              }
            }
          )
        );

      }
    );


    /* =====================================================
       FOREGROUND NOTIFICATIONS
    ====================================================== */

    onMessage(
      messaging,
      function (payload) {

        console.log(
          "Mrs Wolfie foreground notification received:",
          payload
        );


        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieForegroundNotification",
            {
              detail: payload
            }
          )
        );

      }
    );


    /* =====================================================
       ENABLE NOTIFICATIONS
    ====================================================== */

    window.MRS_WOLFIE_ENABLE_NOTIFICATIONS =
      async function () {

        try {

          console.log(
            "Requesting Mrs Wolfie notification permission..."
          );


          const permission =
            await Notification.requestPermission();


          console.log(
            "Mrs Wolfie notification permission:",
            permission
          );


          if (
            permission !== "granted"
          ) {

            window.dispatchEvent(
              new CustomEvent(
                "mrsWolfieNotificationPermission",
                {
                  detail: {
                    permission:
                      permission
                  }
                }
              )
            );


            return {
              success: false,
              permission:
                permission
            };

          }


          /* =================================================
             REGISTER FIREBASE MESSAGING SERVICE WORKER
          ================================================== */

          const messagingRegistration =
            await navigator.serviceWorker.register(
              "./firebase-messaging-sw.js"
            );


          console.log(
            "Mrs Wolfie Firebase Messaging worker registered."
          );


          /* =================================================
             REGISTER THIS INSTALLATION WITH FCM
          ================================================== */

          await register(
            messaging,
            {
              vapidKey:
                MRS_WOLFIE_VAPID_KEY,

              serviceWorkerRegistration:
                messagingRegistration
            }
          );


          console.log(
            "Mrs Wolfie Firebase Messaging registration completed."
          );


          window.dispatchEvent(
            new CustomEvent(
              "mrsWolfieNotificationPermission",
              {
                detail: {
                  permission:
                    "granted"
                }
              }
            )
          );


          return {
            success: true,
            permission:
              "granted"
          };

        }

        catch (error) {

          console.error(
            "Mrs Wolfie notification registration failed:",
            error
          );


          window.dispatchEvent(
            new CustomEvent(
              "mrsWolfieNotificationError",
              {
                detail: {
                  message:
                    error?.message ||
                    "Notification registration failed."
                }
              }
            )
          );


          return {
            success: false,
            error:
              error
          };

        }

      };


    /* =====================================================
       CURRENT NOTIFICATION STATUS
    ====================================================== */

    window.MRS_WOLFIE_NOTIFICATION_STATUS =
      function () {

        return {

          supported:
            true,

          permission:
            Notification.permission,

          installationId:
            localStorage.getItem(
              "mrsWolfieFirebaseInstallationId"
            )

        };

      };


    console.log(
      "Mrs Wolfie notification system ready."
    );

  }

  catch (error) {

    console.error(
      "Mrs Wolfie notification system failed to initialise:",
      error
    );

  }

})();
