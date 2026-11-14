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



    /* Display foreground updates without creating a second OS-level
       notification. All message text is inserted as text, never HTML. */
    let foregroundNoticeTimer = null;
    const recentForegroundMessageIds = new Map();
    function showForegroundNotice(payload) {
      if (document.visibilityState !== "visible" || !document.body) return;
      // Firebase messageId is stable for repeat deliveries of the same push.
      // Keep a short-lived marker across same-tab page navigation.
      const messageId = payload && (payload.messageId || payload.fcmMessageId);
      if (messageId) {
        const key = "mrsWolfieForegroundMessage:" + String(messageId);
        const now = Date.now();
        for (const [id, timestamp] of recentForegroundMessageIds) {
          if (now - timestamp > 60000) recentForegroundMessageIds.delete(id);
        }
        if (recentForegroundMessageIds.has(key)) return;
        try {
          const previous = Number(sessionStorage.getItem(key) || 0);
          if (previous && now - previous >= 0 && now - previous < 60000) return;
          sessionStorage.setItem(key, String(now));
        } catch (error) {
          // Private browsing can disable sessionStorage; in-memory dedupe remains.
        }
        recentForegroundMessageIds.set(key, now);
      }
      const data = payload && payload.data || {};
      const notification = payload && payload.notification || {};
      const title = String(notification.title || data.title || "MRS WOLFIE").slice(0, 100);
      const body = String(notification.body || data.body || "A new update is available.").slice(0, 250);
      const scope = new URL("./", window.location.href);
      let destination;
      try { destination = new URL(String(data.url || "./updates.html"), scope); }
      catch (error) { destination = new URL("./updates.html", scope); }
      if (destination.origin !== scope.origin ||
          !destination.pathname.startsWith(scope.pathname)) {
        destination = new URL("./updates.html", scope);
      }
      let notice = document.getElementById("mrsWolfieForegroundNotice");
      if (!notice) {
        notice = document.createElement("div");
        notice.id = "mrsWolfieForegroundNotice";
        notice.setAttribute("role", "status");
        notice.style.cssText = "position:fixed;bottom:18px;left:18px;right:18px;max-width:420px;margin:auto;z-index:99999;background:#101d2a;color:#fff;border:1px solid #89dcff;border-radius:12px;padding:14px 16px;box-shadow:0 8px 30px #0008;font:15px/1.5 system-ui,sans-serif";
        document.body.appendChild(notice);
      }
      notice.replaceChildren();
      const heading = document.createElement("strong");
      heading.textContent = title;
      const description = document.createElement("div");
      description.textContent = body;
      const open = document.createElement("a");
      open.href = destination.href;
      open.textContent = "View update";
      open.style.cssText = "display:inline-block;margin-top:8px;color:#89dcff";
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "Dismiss";
      dismiss.style.cssText = "margin-left:16px;background:transparent;color:#fff;border:0;cursor:pointer";
      dismiss.addEventListener("click", () => notice.remove());
      notice.append(heading, description, open, dismiss);
      clearTimeout(foregroundNoticeTimer);
      foregroundNoticeTimer = setTimeout(() => notice.remove(), 12000);
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

        showForegroundNotice(payload);


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


          // Do not trigger a redundant prompt when permission is already
          // granted, and do not re-prompt after the browser has denied it.
          const permission = Notification.permission === "default"
            ? await Notification.requestPermission()
            : Notification.permission;


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
        .then(async () => {
          // Complete any ongoing background token check before a manual
          // registration starts, so both cannot write competing tokens.
          if (tokenRecheckInFlight) await tokenRecheckInFlight;
          return enableNotificationsOnce();
        })
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

        // Permission can change in browser settings without a page reload.
        // Invalidate a cached success marker if permission was revoked.
        if (Notification.permission !== "granted") {
          localStorage.removeItem("mrsWolfieFCMToken");
        }

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



    /* Recheck the token when an opted-in supporter returns to the app.
       Never prompt automatically, and only submit if Firebase rotated it. */
    let tokenRecheckInFlight = null;
    async function recheckNotificationToken() {
      if (document.visibilityState !== "visible" ||
          Notification.permission !== "granted" ||
          !localStorage.getItem("mrsWolfieFCMToken")) {
        return;
      }
      if (notificationRegistrationInFlight) return;
      if (tokenRecheckInFlight) return tokenRecheckInFlight;
      tokenRecheckInFlight = (async () => {
        try {
          const previousToken = localStorage.getItem("mrsWolfieFCMToken");
          const registration = await navigator.serviceWorker.getRegistration("./");
          if (!registration) return;
          const currentToken = await getToken(messaging, {
            vapidKey: MRS_WOLFIE_VAPID_KEY,
            serviceWorkerRegistration: registration
          });
          if (!currentToken) return;
          // Stop if the supporter revoked permission or another operation
          // changed the saved token while the network request was running.
          if (Notification.permission !== "granted" ||
              localStorage.getItem("mrsWolfieFCMToken") !== previousToken) return;
          if (currentToken !== previousToken) {
            await registerDeviceWithBackend(currentToken);
            if (Notification.permission !== "granted" ||
                localStorage.getItem("mrsWolfieFCMToken") !== previousToken) return;
            localStorage.setItem("mrsWolfieFCMToken", currentToken);
            window.dispatchEvent(new CustomEvent("mrsWolfieNotificationRegistered", {
              detail: { registered: true, refreshed: true }
            }));
          }
        } catch (error) {
          // A transient connectivity failure must not erase a previously
          // registered token. Retry on the next visibility transition.
          console.warn("Mrs Wolfie notification token recheck failed:", error);
        }
      })().finally(() => { tokenRecheckInFlight = null; });
      return tokenRecheckInFlight;
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        recheckNotificationToken();
      }
    });
    recheckNotificationToken();

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
