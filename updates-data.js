/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL APP UPDATES / NEWS DATABASE

   DATA SOURCES:

   1. Firebase / Firestore
      Collection: mrsWolfieUpdates

   2. Automatic fight results
      Generated from fight-data.js

   Firebase manual updates are managed from:
   Team Wolfpack Admin → Mrs Wolfie → App Updates
========================================================= */


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const MRS_WOLFIE_UPDATES_FIREBASE_CONFIG = {

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
   UPDATE DATABASE
========================================================= */

window.MRS_WOLFIE_UPDATES = {

  /*
    Firebase manual updates will be placed here
    automatically.

    We deliberately start empty.

    Automatic fight results are NOT stored here.
  */

  updates: [],


  /*
    Shows whether Firebase has successfully loaded.
  */

  firebaseLoaded:
    false,


  /*
    Current manual-update data source.
  */

  source:
    "CONNECTING"

};



/* =========================================================
   DATE DISPLAY
========================================================= */

window.MRS_WOLFIE_FORMAT_UPDATE_DATE =
  function(value) {


    if (
      !value
    ) {

      return "";

    }


    const parts =
      String(value)
        .split("-");


    if (
      parts.length !== 3
    ) {

      return String(value);

    }


    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    const day =
      Number(parts[2]);


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);

    }


    return date
      .toLocaleDateString(
        "en-GB",
        {
          day:
            "2-digit",

          month:
            "long",

          year:
            "numeric"
        }
      )
      .toUpperCase();


  };



/* =========================================================
   RESULT WORDING
========================================================= */

window.MRS_WOLFIE_GET_RESULT_WORD =
  function(result) {


    const resultCode =
      String(
        result || ""
      )
        .trim()
        .toUpperCase();


    if (
      resultCode === "W"
    ) {

      return "WIN";

    }


    if (
      resultCode === "L"
    ) {

      return "LOSS";

    }


    if (
      resultCode === "D"
    ) {

      return "DRAW";

    }


    return "";

  };



/* =========================================================
   AUTOMATIC FIGHT RESULT UPDATES
========================================================= */

window.MRS_WOLFIE_GET_RESULT_UPDATES =
  function() {


    /*
      fight-data.js must be loaded before this file.

      If it is unavailable, return no automatic
      result updates rather than breaking the app.
    */

    if (
      typeof window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS
      !==
      "function"
    ) {

      return [];

    }


    const completedFights =
      window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS();


    if (
      !Array.isArray(
        completedFights
      )
    ) {

      return [];

    }


    return completedFights.map(
      function(fight) {


        const resultCode =
          String(
            fight.result || ""
          )
            .trim()
            .toUpperCase();


        const resultWord =
          window.MRS_WOLFIE_GET_RESULT_WORD(
            resultCode
          );


        let resultMessage =
          "";


        /* -----------------------------------------------------
           WIN
        ------------------------------------------------------ */

        if (
          resultCode === "W"
        ) {

          resultMessage =
            "Mrs Wolfie records a win against " +
            (
              fight.opponent ||
              "her opponent"
            ) +
            ".";

        }


        /* -----------------------------------------------------
           LOSS
        ------------------------------------------------------ */

        else if (
          resultCode === "L"
        ) {

          resultMessage =
            "Mrs Wolfie records a loss against " +
            (
              fight.opponent ||
              "her opponent"
            ) +
            ".";

        }


        /* -----------------------------------------------------
           DRAW
        ------------------------------------------------------ */

        else if (
          resultCode === "D"
        ) {

          resultMessage =
            "Mrs Wolfie's fight against " +
            (
              fight.opponent ||
              "her opponent"
            ) +
            " ends in a draw.";

        }



        /* -----------------------------------------------------
           EVENT INFORMATION
        ------------------------------------------------------ */

        const eventParts =
          [];


        if (
          fight.promotion
        ) {

          eventParts.push(
            fight.promotion
          );

        }


        if (
          fight.event
        ) {

          eventParts.push(
            fight.event
          );

        }


        if (
          eventParts.length > 0
        ) {

          resultMessage +=
            " " +
            eventParts.join(
              " • "
            ) +
            ".";

        }



        /* -----------------------------------------------------
           AUTOMATIC RESULT UPDATE
        ------------------------------------------------------ */

        return {

          id:
            "result-" +
            (
              fight.id ||
              fight.date ||
              "fight"
            ),

          type:
            "RESULT",

          title:
            "FIGHT RESULT — " +
            resultWord,

          message:
            resultMessage,

          date:
            fight.date ||
            "",

          dateDisplay:
            fight.dateDisplay ||
            window.MRS_WOLFIE_FORMAT_UPDATE_DATE(
              fight.date
            ),

          buttonText:
            "VIEW FIGHT HISTORY",

          link:
            "./schedule.html#fight-history",

          active:
            true,

          automatic:
            true,

          result:
            resultCode,

          opponent:
            fight.opponent ||
            "",

          promotion:
            fight.promotion ||
            "",

          event:
            fight.event ||
            ""

        };


      }
    );


  };



/* =========================================================
   GET ALL UPDATES
========================================================= */

window.MRS_WOLFIE_GET_ALL_UPDATES =
  function() {


    const manualUpdates =
      Array.isArray(
        window.MRS_WOLFIE_UPDATES.updates
      )
        ? window.MRS_WOLFIE_UPDATES.updates
        : [];


    const resultUpdates =
      window.MRS_WOLFIE_GET_RESULT_UPDATES();


    const combinedUpdates = [

      ...manualUpdates,

      ...resultUpdates

    ];


    /* -------------------------------------------------------
       PREVENT DUPLICATES
    -------------------------------------------------------- */

    const uniqueUpdates =
      [];


    const usedIds =
      new Set();


    combinedUpdates.forEach(
      function(update) {


        const updateId =
          update.id ||
          (
            update.type +
            "-" +
            update.title +
            "-" +
            update.date
          );


        if (
          usedIds.has(
            updateId
          )
        ) {

          return;

        }


        usedIds.add(
          updateId
        );


        uniqueUpdates.push(
          update
        );


      }
    );


    return uniqueUpdates;


  };



/* =========================================================
   UPDATE DATE
========================================================= */

window.MRS_WOLFIE_GET_UPDATE_DATE =
  function(update) {


    if (
      !update ||
      !update.date
    ) {

      return 0;

    }


    const date =
      new Date(
        update.date +
        "T12:00:00"
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return 0;

    }


    return date.getTime();


  };



/* =========================================================
   GET ACTIVE UPDATES
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_UPDATES =
  function() {


    const updates =
      window.MRS_WOLFIE_GET_ALL_UPDATES();


    return updates

      .filter(
        function(update) {

          return (
            update.active === true
          );

        }
      )

      .sort(
        function(a,b) {


          const dateDifference =

            window.MRS_WOLFIE_GET_UPDATE_DATE(
              b
            )

            -

            window.MRS_WOLFIE_GET_UPDATE_DATE(
              a
            );


          if (
            dateDifference !== 0
          ) {

            return dateDifference;

          }


          /*
            If two updates have the same display date,
            newer Firebase documents appear first.
          */

          return (
            Number(
              b.createdAtMilliseconds || 0
            )
            -
            Number(
              a.createdAtMilliseconds || 0
            )
          );


        }
      );


  };



/* =========================================================
   GET LATEST UPDATE
========================================================= */

window.MRS_WOLFIE_GET_LATEST_UPDATE =
  function() {


    const updates =
      window.MRS_WOLFIE_GET_ACTIVE_UPDATES();


    return updates.length
      ? updates[0]
      : null;


  };



/* =========================================================
   GET RESULT UPDATES ONLY
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_RESULT_UPDATES =
  function() {


    return (

      window.MRS_WOLFIE_GET_ACTIVE_UPDATES()

        .filter(
          function(update) {

            return (
              update.type ===
              "RESULT"
            );

          }
        )

    );


  };



/* =========================================================
   NOTIFY THE APP THAT UPDATE DATA CHANGED
========================================================= */

window.MRS_WOLFIE_NOTIFY_UPDATE_CHANGE =
  function(source) {


    window.dispatchEvent(

      new CustomEvent(
        "mrsWolfieUpdateDataUpdated",
        {

          detail: {

            source:
              source ||
              window.MRS_WOLFIE_UPDATES.source,

            updates:
              window.MRS_WOLFIE_UPDATES.updates.length

          }

        }
      )

    );


  };



/* =========================================================
   FIREBASE MANUAL UPDATE LISTENER
========================================================= */

(async function connectMrsWolfieUpdates() {


  try {


    /* -------------------------------------------------------
       LOAD FIREBASE MODULES
    -------------------------------------------------------- */

    const {

      initializeApp,
      getApps,
      getApp

    } =
      await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"
      );


    const {

      getFirestore,
      collection,
      onSnapshot

    } =
      await import(
        "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
      );



    /* -------------------------------------------------------
       CONNECT TO EXISTING TEAM WOLFPACK FIREBASE APP
    -------------------------------------------------------- */

    const firebaseApp =

      getApps().length

        ? getApp()

        : initializeApp(
            MRS_WOLFIE_UPDATES_FIREBASE_CONFIG
          );


    const db =
      getFirestore(
        firebaseApp
      );


    const updatesCollection =
      collection(
        db,
        "mrsWolfieUpdates"
      );



    /* -------------------------------------------------------
       REAL-TIME FIRESTORE LISTENER
    -------------------------------------------------------- */

    onSnapshot(

      updatesCollection,

      function(snapshot) {


        const firebaseUpdates =
          [];


        snapshot.forEach(
          function(item) {


            const data =
              item.data() ||
              {};


            /*
              Support the field names used by the
              Mrs Wolfie App Updates Manager.
            */

            const updateDate =
              data.date ||
              data.displayDate ||
              "";


            let createdAtMilliseconds =
              0;


            if (
              data.createdAt &&
              typeof data.createdAt.toMillis ===
              "function"
            ) {

              createdAtMilliseconds =
                data.createdAt.toMillis();

            }


            firebaseUpdates.push({

              id:
                item.id,

              type:
                String(
                  data.type ||
                  "NEWS"
                )
                  .trim()
                  .toUpperCase(),

              title:
                String(
                  data.title ||
                  ""
                )
                  .trim(),

              message:
                String(
                  data.message ||
                  ""
                )
                  .trim(),

              date:
                updateDate,

              dateDisplay:
                data.dateDisplay ||
                window.MRS_WOLFIE_FORMAT_UPDATE_DATE(
                  updateDate
                ),

              /*
                Support either buttonText or button
                if the manager uses one of those names.
              */

              buttonText:
                String(
                  data.buttonText ||
                  data.button ||
                  ""
                )
                  .trim(),

              /*
                Support either link or buttonLink.
              */

              link:
                String(
                  data.link ||
                  data.buttonLink ||
                  ""
                )
                  .trim(),

              /*
                Published updates should appear.

                This also supports "published" if that
                is the field used by the admin manager.
              */

              active:
                data.active === true ||
                data.published === true,

              automatic:
                false,

              createdAtMilliseconds:
                createdAtMilliseconds

            });


          }
        );



        /* -----------------------------------------------------
           REPLACE MANUAL UPDATE DATABASE
        ------------------------------------------------------ */

        window.MRS_WOLFIE_UPDATES.updates =
          firebaseUpdates;


        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          true;


        window.MRS_WOLFIE_UPDATES.source =
          "FIREBASE";


        console.log(
          "Mrs Wolfie Updates: Firebase connected —",
          firebaseUpdates.length,
          "manual update(s)"
        );


        /*
          Tell Updates page / Home page that fresh
          update data is now available.
        */

        window.MRS_WOLFIE_NOTIFY_UPDATE_CHANGE(
          "FIREBASE"
        );


      },


      function(error) {


        console.error(
          "Mrs Wolfie Updates Firebase:",
          error
        );


        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          false;


        window.MRS_WOLFIE_UPDATES.source =
          "FIREBASE ERROR";


        /*
          Automatic fight-result updates remain
          operational even if manual Firebase updates
          temporarily fail.
        */

        window.MRS_WOLFIE_NOTIFY_UPDATE_CHANGE(
          "FIREBASE ERROR"
        );


      }

    );


  }


  catch(error) {


    console.error(
      "Mrs Wolfie Updates connection:",
      error
    );


    window.MRS_WOLFIE_UPDATES.firebaseLoaded =
      false;


    window.MRS_WOLFIE_UPDATES.source =
      "FIREBASE ERROR";


    window.MRS_WOLFIE_NOTIFY_UPDATE_CHANGE(
      "FIREBASE ERROR"
    );


  }


})();
