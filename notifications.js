/* =========================================================
   MRS WOLFIE BOXING APP
   PUSH NOTIFICATIONS
========================================================= */


/* =========================================================
   CONFIGURATION
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
   NOTIFICATION SYSTEM
========================================================= */

(async function () {

  /*
    Do nothing on browsers that cannot use the
    required notification technologies.
  */

  if (
    !("Notification" in window) ||
    !("serviceWorker" in navigator)
  ) {

    console.log(
      "Mrs Wolfie notifications are not supported on this browser."
    );

    return;

  }


  try {

    /* =====================================================
       FIREBASE MODULES
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

    const supported =
      await isSupported();


    if (!supported) {

      console.log(
        "Firebase Messaging is not supported on this browser."
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
       REGISTRATION CALLBACK
    ====================================================== */

    onRegistered(
      messaging,
      (installationId) => {

        console.log(
          "Mrs Wolfie notification installation registered:",
          installationId
        );


        /*
          Store this locally for the moment.

          Later we will securely connect the installation ID
          to the Team Wolfpack notification sender.
        */

        localStorage.setItem(
          "mrsWolfieFirebaseInstallationId",
          installationId
        );


        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieNotificationRegistered",
            {
              detail: {
                installationId
              }
            }
          )
        );

      }
    );



    /* =====================================================
       FOREGROUND MESSAGES
    ====================================================== */

    onMessage(
      messaging,
      (payload) => {

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

          /*
            Permission should be requested as the result
            of a deliberate user action such as pressing
            an Enable Notifications button.
          */

          const permission =
            await Notification.requestPermission();


          if (
            permission !== "granted"
          ) {

            console.log(
              "Mrs Wolfie notification permission:",
              permission
            );


            window.dispatchEvent(
              new CustomEvent(
                "mrsWolfieNotificationPermission",
                {
                  detail: {
                    permission
                  }
                }
              )
            );


            return {
              success: false,
              permission
            };

          }



          /* =================================================
             MESSAGING SERVICE WORKER
          ================================================== */

          const registration =
            await navigator.serviceWorker.register(
              "./firebase-messaging-sw.js",
              {
                scope: "./"
              }
            );


          await navigator.serviceWorker.ready;



          /* =================================================
             REGISTER THIS APP INSTALLATION WITH FCM
          ================================================== */

          await register(
            messaging,
            {
              vapidKey:
                MRS_WOLFIE_VAPID_KEY,

              serviceWorkerRegistration:
                registration
            }
          );



          console.log(
            "Mrs Wolfie push notifications enabled."
          );


          window.dispatchEvent(
            new CustomEvent(
              "mrsWolfieNotificationPermission",
              {
                detail: {
                  permission: "granted"
                }
              }
            )
          );


          return {
            success: true,
            permission: "granted"
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
            error
          };

        }


      };



    /* =====================================================
       CURRENT STATUS
    ====================================================== */

    window.MRS_WOLFIE_NOTIFICATION_STATUS =
      function () {

        return {

          supported: true,

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
