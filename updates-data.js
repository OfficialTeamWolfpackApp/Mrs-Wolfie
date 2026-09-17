/* =========================================================
   MRS WOLFIE BOXING APP
   LIVE APP UPDATES / NEWS DATABASE
========================================================= */


/* =========================================================
   LOCAL FALLBACK UPDATES

   These are used only while Firebase is connecting or
   if Firebase cannot be reached.

   Once Firebase connects successfully, the live
   mrsWolfieUpdates collection becomes the source for
   manual app updates.

   Automatic fight results are still generated separately
   from fight-data.js.
========================================================= */

window.MRS_WOLFIE_UPDATES = {

  updates: [],

  source: "LOCAL FALLBACK",

  firebaseLoaded: false

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



    return completedFights

      .filter(
        fight => {

          const result =
            String(
              fight?.result || ""
            )
              .trim()
              .toUpperCase();

          return (
            result === "W" ||
            result === "L" ||
            result === "D"
          );

        }
      )

      .map(
        fight => {


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



          /* -------------------------------------------------
             RESULT MESSAGE
          -------------------------------------------------- */

          let resultMessage = "";


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



          /* -------------------------------------------------
             EVENT INFORMATION
          -------------------------------------------------- */

          const eventParts = [];


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



          /* -------------------------------------------------
             AUTOMATIC RESULT UPDATE
          -------------------------------------------------- */

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
              "",

            buttonText:
              "VIEW FIGHT HISTORY",

            link:
              "./schedule.html#fight-history",

            active:
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
        window.MRS_WOLFIE_UPDATES?.updates
      )
        ?
        window.MRS_WOLFIE_UPDATES.updates
        :
        [];


    const resultUpdates =
      typeof window.MRS_WOLFIE_GET_RESULT_UPDATES ===
      "function"
        ?
        window.MRS_WOLFIE_GET_RESULT_UPDATES()
        :
        [];


    const combinedUpdates = [

      ...manualUpdates,

      ...resultUpdates

    ];



    /* -------------------------------------------------------
       PREVENT DUPLICATES
    -------------------------------------------------------- */

    const uniqueUpdates = [];

    const usedIds =
      new Set();



    combinedUpdates.forEach(
      update => {


        if (
          !update
        ) {

          return;

        }


        const updateId =
          update.id ||
          (
            String(
              update.type ||
              "UPDATE"
            ) +
            "-" +
            String(
              update.title ||
              ""
            ) +
            "-" +
            String(
              update.date ||
              ""
            )
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
        update => {

          return (
            update.active === true
          );

        }
      )

      .sort(
        (a,b) => {

          return (

            window.MRS_WOLFIE_GET_UPDATE_DATE(
              b
            )

            -

            window.MRS_WOLFIE_GET_UPDATE_DATE(
              a
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


    return (
      updates.length
        ?
        updates[0]
        :
        null
    );

  };



/* =========================================================
   GET RESULT UPDATES ONLY
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_RESULT_UPDATES =
  function() {


    return (

      window.MRS_WOLFIE_GET_ACTIVE_UPDATES()

        .filter(
          update => {

            return (
              String(
                update.type ||
                ""
              )
                .toUpperCase()
              ===
              "RESULT"
            );

          }
        )

    );

  };



/* =========================================================
   DATE DISPLAY FORMATTER
========================================================= */

window.MRS_WOLFIE_FORMAT_UPDATE_DATE =
  function(dateString) {


    if (
      !dateString
    ) {

      return "";

    }


    const date =
      new Date(
        dateString +
        "T12:00:00"
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";

    }


    return date
      .toLocaleDateString(
        "en-GB",
        {
          day:"2-digit",
          month:"long",
          year:"numeric"
        }
      )
      .toUpperCase();

  };



/* =========================================================
   LIVE FIREBASE APP UPDATES
========================================================= */

(async function connectMrsWolfieUpdates(){


  try {


    /* -------------------------------------------------------
       FIREBASE MODULES
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
       FIREBASE CONFIG
    -------------------------------------------------------- */

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



    /* -------------------------------------------------------
       USE EXISTING FIREBASE APP IF ONE ALREADY EXISTS
    -------------------------------------------------------- */

    const firebaseApp =
      getApps().length
        ?
        getApp()
        :
        initializeApp(
          firebaseConfig
        );


    const db =
      getFirestore(
        firebaseApp
      );



    /* -------------------------------------------------------
       LIVE UPDATE LISTENER
    -------------------------------------------------------- */

    const updatesCollection =
      collection(
        db,
        "mrsWolfieUpdates"
      );


    onSnapshot(

      updatesCollection,

      snapshot => {


        const firebaseUpdates = [];



        snapshot.forEach(
          documentSnapshot => {


            const data =
              documentSnapshot.data() ||
              {};


            const date =
              String(
                data.date ||
                ""
              )
                .trim();


            const type =
              String(
                data.type ||
                "NEWS"
              )
                .trim()
                .toUpperCase();


            const title =
              String(
                data.title ||
                "MRS WOLFIE UPDATE"
              )
                .trim();


            const message =
              String(
                data.message ||
                ""
              )
                .trim();


            const buttonText =
              String(
                data.buttonText ||
                ""
              )
                .trim();


            const link =
              String(
                data.link ||
                ""
              )
                .trim();



            /*
              Support either "active" or "published".

              This makes the public app tolerant of the
              field name used by the admin manager.
            */

            let active = true;


            if (
              typeof data.active ===
              "boolean"
            ) {

              active =
                data.active;

            }

            else if (
              typeof data.published ===
              "boolean"
            ) {

              active =
                data.published;

            }



            const dateDisplay =
              String(
                data.dateDisplay ||
                ""
              )
                .trim()
              ||
              window.MRS_WOLFIE_FORMAT_UPDATE_DATE(
                date
              );



            firebaseUpdates.push({

              id:
                documentSnapshot.id,

              type:
                type,

              title:
                title,

              message:
                message,

              date:
                date,

              dateDisplay:
                dateDisplay,

              buttonText:
                buttonText,

              link:
                link,

              active:
                active

            });


          }
        );



        /* ---------------------------------------------------
           SORT FIREBASE UPDATES
        ---------------------------------------------------- */

        firebaseUpdates.sort(
          (a,b) => {

            return (

              window.MRS_WOLFIE_GET_UPDATE_DATE(
                b
              )

              -

              window.MRS_WOLFIE_GET_UPDATE_DATE(
                a
              )

            );

          }
        );



        /* ---------------------------------------------------
           REPLACE MANUAL DATABASE WITH FIREBASE DATA
        ---------------------------------------------------- */

        window.MRS_WOLFIE_UPDATES.updates =
          firebaseUpdates;


        window.MRS_WOLFIE_UPDATES.source =
          "FIREBASE";


        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          true;



        console.log(
          "Mrs Wolfie live updates loaded:",
          firebaseUpdates.length
        );



        /* ---------------------------------------------------
           NOTIFY EVERY OPEN PAGE

           index.html and updates.html can listen for this
           event and redraw immediately.
        ---------------------------------------------------- */

        window.dispatchEvent(

          new CustomEvent(
            "mrsWolfieUpdateDataUpdated",
            {

              detail: {

                source:
                  "FIREBASE",

                updates:
                  firebaseUpdates.length

              }

            }
          )

        );


      },



      error => {


        console.error(
          "Mrs Wolfie live updates listener failed:",
          error
        );


        window.MRS_WOLFIE_UPDATES.source =
          "LOCAL FALLBACK";


        window.MRS_WOLFIE_UPDATES.firebaseLoaded =
          false;



        window.dispatchEvent(

          new CustomEvent(
            "mrsWolfieUpdateDataUpdated",
            {

              detail: {

                source:
                  "LOCAL FALLBACK",

                error:
                  true

              }

            }
          )

        );


      }

    );


  }


  catch(error) {


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
        "mrsWolfieUpdateDataUpdated",
        {

          detail: {

            source:
              "LOCAL FALLBACK",

            error:
              true

          }

        }
      )

    );


  }


})();
