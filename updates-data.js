/* =========================================================
   MRS WOLFIE BOXING APP
   LIVE APP UPDATES / NEWS DATABASE
========================================================= */

/* =========================================================
   LOCAL FALLBACK UPDATES
========================================================= */

window.MRS_WOLFIE_UPDATES = {
  updates: [],
  source: "LOCAL FALLBACK",
  firebaseLoaded: false
};


/* =========================================================
   RESULT WORDING
========================================================= */

window.MRS_WOLFIE_GET_RESULT_WORD = function(result) {

  const code = String(result || "").trim().toUpperCase();

  if (code === "W") return "WIN";
  if (code === "L") return "LOSS";
  if (code === "D") return "DRAW";

  return "";
};


/* =========================================================
   AUTOMATIC FIGHT RESULT UPDATES
========================================================= */

window.MRS_WOLFIE_GET_RESULT_UPDATES = function() {

  if (
    typeof window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS
    !== "function"
  ) {
    return [];
  }

  const completedFights =
    window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS();

  if (!Array.isArray(completedFights)) {
    return [];
  }

  return completedFights
    .filter(fight => {

      const result = String(
        fight?.result || ""
      ).trim().toUpperCase();

      return ["W", "L", "D"].includes(result);

    })
    .map(fight => {

      const resultCode = String(
        fight.result || ""
      ).trim().toUpperCase();

      const resultWord =
        window.MRS_WOLFIE_GET_RESULT_WORD(resultCode);

      const opponent =
        fight.opponent || "her opponent";

      let resultMessage = "";

      if (resultCode === "W") {

        resultMessage =
          "Mrs Wolfie records a win against " +
          opponent + ".";

      } else if (resultCode === "L") {

        resultMessage =
          "Mrs Wolfie records a loss against " +
          opponent + ".";

      } else if (resultCode === "D") {

        resultMessage =
          "Mrs Wolfie's fight against " +
          opponent + " ends in a draw.";

      }

      const eventParts = [];

      if (fight.promotion) {
        eventParts.push(fight.promotion);
      }

      if (fight.event) {
        eventParts.push(fight.event);
      }

      if (eventParts.length > 0) {

        resultMessage +=
          " " + eventParts.join(" • ") + ".";

      }

      return {

        id:
          "result-" +
          (fight.id || fight.date || "fight"),

        type: "RESULT",

        title:
          "FIGHT RESULT — " + resultWord,

        message: resultMessage,

        date: fight.date || "",

        dateDisplay: fight.dateDisplay || "",

        buttonText: "VIEW FIGHT HISTORY",

        link: "./schedule.html#fight-history",

        active: true,

        result: resultCode,

        opponent: fight.opponent || "",

        promotion: fight.promotion || "",

        event: fight.event || ""

      };

    });

};


/* =========================================================
   GET ALL UPDATES
========================================================= */

window.MRS_WOLFIE_GET_ALL_UPDATES = function() {

  const manualUpdates =
    Array.isArray(window.MRS_WOLFIE_UPDATES?.updates)
      ? window.MRS_WOLFIE_UPDATES.updates
      : [];

  const resultUpdates =
    typeof window.MRS_WOLFIE_GET_RESULT_UPDATES === "function"
      ? window.MRS_WOLFIE_GET_RESULT_UPDATES()
      : [];

  const combinedUpdates = [
    ...manualUpdates,
    ...resultUpdates
  ];

  const uniqueUpdates = [];

  const usedIds = new Set();

  combinedUpdates.forEach(update => {

    if (!update) return;

    const updateId =
      update.id ||
      (
        String(update.type || "UPDATE") +
        "-" +
        String(update.title || "") +
        "-" +
        String(update.date || "")
      );

    if (usedIds.has(updateId)) {
      return;
    }

    usedIds.add(updateId);

    uniqueUpdates.push(update);

  });

  return uniqueUpdates;

};


/* =========================================================
   UPDATE DATE
========================================================= */

window.MRS_WOLFIE_GET_UPDATE_DATE = function(update) {

  if (!update || !update.date) {
    return 0;
  }

  const date = new Date(
    update.date + "T12:00:00"
  );

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  return date.getTime();

};


/* =========================================================
   GET ACTIVE UPDATES
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_UPDATES = function() {

  return window.MRS_WOLFIE_GET_ALL_UPDATES()

    .filter(update => update.active === true)

    .sort((a, b) => {

      return (
        window.MRS_WOLFIE_GET_UPDATE_DATE(b) -
        window.MRS_WOLFIE_GET_UPDATE_DATE(a)
      );

    });

};


/* =========================================================
   GET LATEST UPDATE
========================================================= */

window.MRS_WOLFIE_GET_LATEST_UPDATE = function() {

  const updates =
    window.MRS_WOLFIE_GET_ACTIVE_UPDATES();

  return updates.length ? updates[0] : null;

};


/* =========================================================
   GET RESULT UPDATES ONLY
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_RESULT_UPDATES = function() {

  return window.MRS_WOLFIE_GET_ACTIVE_UPDATES()
    .filter(update => {

      return String(
        update.type || ""
      ).toUpperCase() === "RESULT";

    });

};


/* =========================================================
   DATE DISPLAY FORMATTER
========================================================= */

window.MRS_WOLFIE_FORMAT_UPDATE_DATE = function(dateString) {

  if (!dateString) {
    return "";
  }

  const date = new Date(
    dateString + "T12:00:00"
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-GB", {

    day: "2-digit",
    month: "long",
    year: "numeric"

  }).toUpperCase();

};


/* =========================================================
   LIVE FIREBASE APP UPDATES
========================================================= */

(async function connectMrsWolfieUpdates() {

  try {

    /* =====================================================
       FIREBASE MODULES
    ===================================================== */

    const {
      initializeApp,
      getApps,
      getApp
    } = await import(
      "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"
    );

    const {
      getFirestore,
      collection,
      query,
      where,
      onSnapshot
    } = await import(
      "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
    );


    /* =====================================================
       FIREBASE CONFIGURATION
    ===================================================== */

    const firebaseConfig = {

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


    /* =====================================================
       INITIALISE FIREBASE
    ===================================================== */

    const firebaseApp =
      getApps().length
        ? getApp()
        : initializeApp(firebaseConfig);

    const db = getFirestore(firebaseApp);


    /* =====================================================
       MRS WOLFIE UPDATES COLLECTION
    ===================================================== */

    const updatesCollection = collection(
      db,
      "mrsWolfieUpdates"
    );


    /* =====================================================
       ONLY LOAD PUBLISHED UPDATES
    ===================================================== */

    const activeUpdatesQuery = query(

      updatesCollection,

      where("active", "==", true)

    );


    /* =====================================================
       LIVE FIRESTORE LISTENER
    ===================================================== */

    onSnapshot(

      activeUpdatesQuery,

      snapshot => {

        const firebaseUpdates = [];

        snapshot.forEach(documentSnapshot => {

          const data =
            documentSnapshot.data() || {};


          /* =========================================
             UPDATE INFORMATION
          ========================================= */

          const date = String(
            data.date || ""
          ).trim();

          const type = String(
            data.type || "NEWS"
          ).trim().toUpperCase();

          const title = String(
            data.title || "MRS WOLFIE UPDATE"
          ).trim();

          const message = String(
            data.message || ""
          ).trim();


          /* =========================================
             UPDATE IMAGE
          ========================================= */

          const imageUrl = String(
            data.imageUrl || ""
          ).trim();


          /* =========================================
             IMAGE RATIO
          ========================================= */

          const allowedRatios = [
            "16:9",
            "4:5",
            "1:1",
            "9:16",
            "full"
          ];

          const savedRatio = String(
            data.imageRatio || "full"
          ).trim();

          const imageRatio =
            allowedRatios.includes(savedRatio)
              ? savedRatio
              : "full";


          /* =========================================
             IMAGE POSITION
          ========================================= */

          function clampPosition(value) {

            const number = Number(value);

            if (!Number.isFinite(number)) {
              return 50;
            }

            return Math.max(
              0,
              Math.min(100, number)
            );

          }

          const imagePositionX =
            clampPosition(data.imagePositionX ?? 50);

          const imagePositionY =
            clampPosition(data.imagePositionY ?? 50);


          /* =========================================
             IMAGE ZOOM
          ========================================= */

          const savedZoom = Number(
            data.imageZoom ?? 100
          );

          const imageZoom =
            Number.isFinite(savedZoom)
              ? Math.max(100, Math.min(200, savedZoom))
              : 100;


          /* =========================================
             BUTTON SETTINGS
          ========================================= */

          const buttonText = String(
            data.buttonText || ""
          ).trim();

          const link = String(
            data.link || ""
          ).trim();


          /* =========================================
             DATE DISPLAY
          ========================================= */

          const dateDisplay =
            String(data.dateDisplay || "").trim() ||
            window.MRS_WOLFIE_FORMAT_UPDATE_DATE(date);


          /* =========================================
             ADD UPDATE TO DATABASE
          ========================================= */

          firebaseUpdates.push({

            id: documentSnapshot.id,

            type: type,

            title: title,

            message: message,

            date: date,

            dateDisplay: dateDisplay,

            imageUrl: imageUrl,

            imageRatio: imageRatio,

            imagePositionX: imagePositionX,

            imagePositionY: imagePositionY,

            imageZoom: imageZoom,

            buttonText: buttonText,

            link: link,

            active: true

          });

        });


        /* =================================================
           SORT NEWEST FIRST
        ================================================= */

        firebaseUpdates.sort((a, b) => {

          return (
            window.MRS_WOLFIE_GET_UPDATE_DATE(b) -
            window.MRS_WOLFIE_GET_UPDATE_DATE(a)
          );

        });


        /* =================================================
           UPDATE PUBLIC DATABASE
        ================================================= */

        window.MRS_WOLFIE_UPDATES.updates =
          firebaseUpdates;

        window.MRS_WOLFIE_UPDATES.source =
          "FIREBASE";

        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          true;


        console.log(
          "Mrs Wolfie active updates loaded:",
          firebaseUpdates.length
        );


        /* =================================================
           NOTIFY HOMEPAGE AND UPDATES PAGE
        ================================================= */

        window.dispatchEvent(

          new CustomEvent(
            "mrsWolfieUpdatesDataUpdated",
            {

              detail: {

                source: "FIREBASE",

                updates: firebaseUpdates.length

              }

            }
          )

        );

      },


      /* ===================================================
         FIREBASE LISTENER ERROR
      =================================================== */

      error => {

        console.error(
          "Mrs Wolfie active updates listener failed:",
          error
        );

        window.MRS_WOLFIE_UPDATES.source =
          "LOCAL FALLBACK";

        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          false;

        window.dispatchEvent(

          new CustomEvent(
            "mrsWolfieUpdatesDataUpdated",
            {

              detail: {

                source: "LOCAL FALLBACK",

                error: true

              }

            }
          )

        );

      }

    );

  }


  /* =======================================================
     FIREBASE CONNECTION ERROR
  ======================================================== */

  catch (error) {

    console.error(
      "Mrs Wolfie Firebase updates connection failed:",
      error
    );

    window.MRS_WOLFIE_UPDATES.source =
      "LOCAL FALLBACK";

    window.MRS_WOLFIE_UPDATES.firebaseLoaded =
      false;

    window.dispatchEvent(

      new CustomEvent(
        "mrsWolfieUpdatesDataUpdated",
        {

          detail: {

            source: "LOCAL FALLBACK",

            error: true

          }

        }
      )

    );

  }

})();
