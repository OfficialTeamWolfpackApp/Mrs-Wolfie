/* =========================================================
   MRS WOLFIE BOXING APP
   PUSH NOTIFICATIONS
   FCM + APP CHECK + SECURE DEVICE REGISTRATION
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const MRS_WOLFIE_VAPID_KEY =
  "BFiQ3IfeNlorv_csTQPN0qD7MKDu-98GjjPzxL7x5AK3sJmxlZyA6dGpDD9uEUpkxWlNZv4jQ37QdnvRTQckRrg";


const MRS_WOLFIE_APP_CHECK_SITE_KEY =
  "6LfYlcItAAAAAGQtEJFKYH6fyERwXiAfVeBqJhOR";


const MRS_WOLFIE_REGISTER_DEVICE_URL =
  "https://europe-west1-team-wolfpack-app.cloudfunctions.net/registerMrsWolfiePushDevice";


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
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {

    console.log(
      "Mrs Wolfie push notifications require a secure, compatible browser."
    );

    window.MRS_WOLFIE_NOTIFICATION_STATUS = function () {
      return { supported: false, permission: "unsupported", registered: false };
    };
    window.MRS_WOLFIE_ENABLE_NOTIFICATIONS = async function () {
      return { success: false, permission: "unsupported" };
    };
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


    const firebaseAppCheckModule =
      await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-check.js"
      );


    const {
      initializeApp,
      getApps,
      getApp
    } = firebaseAppModule;


    const {
      getMessaging,
      getToken,
      onMessage,
      isSupported
    } = firebaseMessagingModule;


    const {
      initializeAppCheck,
      ReCaptchaEnterpriseProvider,
      getToken: getAppCheckToken
    } = firebaseAppCheckModule;



    /* =====================================================
       CHECK FIREBASE MESSAGING SUPPORT
    ====================================================== */

    const messagingSupported =
      await isSupported();


    if (
      !messagingSupported
    ) {

      console.log(
        "Firebase Cloud Messaging is not supported by this browser."
      );

      window.MRS_WOLFIE_NOTIFICATION_STATUS = function () {
        return { supported: false, permission: "unsupported", registered: false };
      };
      window.MRS_WOLFIE_ENABLE_NOTIFICATIONS = async function () {
        return { success: false, permission: "unsupported" };
      };
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



    /* =====================================================
       FIREBASE APP CHECK
    ====================================================== */

    const appCheck =
      initializeAppCheck(
        app,
        {
          provider:
            new ReCaptchaEnterpriseProvider(
              MRS_WOLFIE_APP_CHECK_SITE_KEY
            ),

          isTokenAutoRefreshEnabled:
            true
        }
      );


    console.log(
      "Mrs Wolfie Firebase App Check initialised."
    );



    /* =====================================================
       FIREBASE MESSAGING
    ====================================================== */

    const messaging =
      getMessaging(
        app
      );



    /* =====================================================
       REGISTER DEVICE WITH SECURE BACKEND
    ====================================================== */

    async function registerDeviceWithBackend(
      fcmToken
    ) {

      const appCheckResult =
        await getAppCheckToken(
          appCheck,
          false
        );


      if (
        !appCheckResult ||
        !appCheckResult.token
      ) {

        throw new Error(
          "Firebase App Check did not return a token."
        );

      }


      const response =
        await fetch(
          MRS_WOLFIE_REGISTER_DEVICE_URL,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              "X-Firebase-AppCheck":
                appCheckResult.token
            },

            body:
              JSON.stringify(
                {
                  token:
                    fcmToken
                }
              )
          }
        );


      let result = {};


      try {

        result =
          await response.json();

      }

      catch (error) {

        console.error(
          "Mrs Wolfie backend returned an invalid response.",
          error
        );

      }


      if (
        !response.ok ||
        !result.success
      ) {

        throw new Error(
          result.error ||
          "Secure notification registration failed."
        );

      }


      console.log(
        "Mrs Wolfie device securely registered with backend."
      );


      return result;

    }



    /* =====================================================
       FOREGROUND MESSAGES
    ====================================================== */

    onMessage(
      messaging,
      function (payload) {

        console.log(
          "Mrs Wolfie foreground notification received."
        );


        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieForegroundNotification",
            {
              detail:
                payload
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



          /* =================================================
             PERMISSION NOT GRANTED
          ================================================== */

          if (
            permission !== "granted"
          ) {

            localStorage.removeItem("mrsWolfieFCMToken");

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
              success:
                false,

              permission:
                permission
            };

          }



          /* =================================================
             REGISTER UNIFIED SERVICE WORKER
          ================================================== */

          const messagingRegistration =
            await navigator.serviceWorker.register(
              "./service-worker.js",
              {
                updateViaCache:
                  "none"
              }
            );


          console.log(
            "Mrs Wolfie unified PWA + Messaging worker registered."
          );



          /* =================================================
             WAIT FOR SERVICE WORKER
          ================================================== */

          await navigator.serviceWorker.ready;


          console.log(
            "Mrs Wolfie unified service worker ready."
          );



          /* =================================================
             GET FIREBASE CLOUD MESSAGING TOKEN
          ================================================== */

          const token =
            await getToken(
              messaging,
              {
                vapidKey:
                  MRS_WOLFIE_VAPID_KEY,

                serviceWorkerRegistration:
                  messagingRegistration
              }
            );


          if (
            !token
          ) {

            throw new Error(
              "Firebase did not return a notification registration token."
            );

          }



          /* =================================================
             REGISTER WITH PROTECTED CLOUD FUNCTION
          ================================================== */

          await registerDeviceWithBackend(
            token
          );



          /* =================================================
             STORE TOKEN LOCALLY
          ================================================== */

          localStorage.setItem(
            "mrsWolfieFCMToken",
            token
          );


          console.log(
            "Mrs Wolfie push notifications enabled."
          );



          /* =================================================
             REGISTRATION EVENT
          ================================================== */

          window.dispatchEvent(
            new CustomEvent(
              "mrsWolfieNotificationRegistered",
              {
                detail: {
                  registered:
                    true
                }
              }
            )
          );



          /* =================================================
             PERMISSION EVENT
          ================================================== */

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

            success:
              true,

            permission:
              "granted",

            registered:
              true

          };

        }


        catch (error) {

          console.error(
            "Mrs Wolfie notification registration failed:",
            error
          );

          // A locally stored token does not prove backend registration.
          localStorage.removeItem("mrsWolfieFCMToken");


          window.dispatchEvent(
            new CustomEvent(
              "mrsWolfieNotificationError",
              {
                detail: {
                  message:
                    error && error.message
                      ? error.message
                      : "Notification registration failed."
                }
              }
            )
          );


          return {

            success:
              false,

            error:
              error

          };

        }

      };



    /* Avoid simultaneous permission prompts and duplicate token submissions.
       A later explicit request can retry after the first has settled. */
    const enableNotificationsOnce = window.MRS_WOLFIE_ENABLE_NOTIFICATIONS;
    let notificationRegistrationInFlight = null;
    window.MRS_WOLFIE_ENABLE_NOTIFICATIONS = function () {
      if (notificationRegistrationInFlight) {
        return notificationRegistrationInFlight;
      }
      notificationRegistrationInFlight = Promise.resolve()
        .then(() => enableNotificationsOnce())
        .finally(() => {
          notificationRegistrationInFlight = null;
        });
      return notificationRegistrationInFlight;
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

          registered:
            Notification.permission === "granted" &&
            Boolean(
              localStorage.getItem(
                "mrsWolfieFCMToken"
              )
            )

        };

      };



    /* =====================================================
       SYSTEM READY
    ====================================================== */

    console.log(
      "Mrs Wolfie notification system ready."
    );

  }


  catch (error) {

    console.error(
      "Mrs Wolfie notification system failed to initialise:",
      error
    );

    window.MRS_WOLFIE_NOTIFICATION_STATUS = function () {
      return { supported: false, permission: Notification.permission, registered: false };
    };
    window.MRS_WOLFIE_ENABLE_NOTIFICATIONS = async function () {
      return { success: false, error: "Notification system unavailable" };
    };

  }

})();
