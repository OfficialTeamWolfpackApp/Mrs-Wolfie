/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL FIGHT DATABASE

   LIVE DATA:
   Team Wolfpack Firebase / Cloud Firestore

   COLLECTION:
   mrsWolfieFights

   FALLBACK:
   Local announced fights remain available if Firebase
   cannot be reached.
========================================================= */


/* =========================================================
   LOCAL FALLBACK ANNOUNCED FIGHTS
========================================================= */

const MRS_WOLFIE_FALLBACK_FIGHTS = [

  {
    id: "fight-17-oct-2026",
    promotion: "AYRSHIRE BOXING",
    event: "THE LAUNCH",
    opponent: "COLLEEN LEYDEN",
    date: "2026-10-17",
    dateDisplay: "17 OCTOBER 2026",
    venue: "AYR RACECOURSE",
    status: "UPCOMING",
    type: "FIGHT NIGHT",
    result: ""
  },

  {
    id: "fight-20-nov-2026",
    promotion: "TRAIN4FIGHT",
    event: "SUPER MIDDLEWEIGHT TITLE",
    opponent: "TBA",
    date: "2026-11-20",
    dateEnd: "2026-11-21",
    dateDisplay: "20/21 NOVEMBER 2026",
    venue: "EASTHOUSES MINERS CLUB",
    status: "UPCOMING",
    type: "TITLE FIGHT",
    result: ""
  }

];


/* =========================================================
   MAIN DATABASE
========================================================= */

window.MRS_WOLFIE_FIGHTS = {

  /*
    This starts with the fallback fights.

    Firebase replaces this array when the live database
    successfully loads.
  */

  upcoming: [
    ...MRS_WOLFIE_FALLBACK_FIGHTS
  ],


  /* =======================================================
     PERMANENT EXISTING FIGHT HISTORY
  ======================================================== */

  history: [

    {
      id: "fight-14-mar-2026",
      promotion: "TRAIN 4 FIGHT PROMOTIONS",
      event: "",
      opponent: "KATIE FAE THE BING",
      date: "2026-03-14",
      dateDisplay: "14 MARCH 2026",
      venue: "EASTHOUSES MINERS CLUB",
      result: "W"
    },

    {
      id: "fight-05-jul-2025",
      promotion: "EBO",
      event: "",
      opponent: "BRY KELLY",
      date: "2025-07-05",
      dateDisplay: "05 JULY 2025",
      venue: "TRILOGY NIGHTCLUB",
      result: "L"
    },

    {
      id: "fight-25-may-2025",
      promotion: "EBO",
      event: "",
      opponent: "DEMI WISE",
      date: "2025-05-25",
      dateDisplay: "25 MAY 2025",
      venue: "TRILOGY NIGHTCLUB",
      result: "L"
    }

  ],

  nextFight: null,

  source: "LOCAL FALLBACK",

  firebaseLoaded: false

};


/* =========================================================
   DATE HELPER
========================================================= */

window.MRS_WOLFIE_CREATE_DATE =
  function(dateString) {

    if (!dateString) {
      return new Date("Invalid Date");
    }

    return new Date(
      dateString + "T12:00:00"
    );

  };


/* =========================================================
   DATE DISPLAY HELPER
========================================================= */

window.MRS_WOLFIE_FORMAT_DATE =
  function(dateString) {

    if (!dateString) {
      return "";
    }

    const date =
      window.MRS_WOLFIE_CREATE_DATE(
        dateString
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
          day: "2-digit",
          month: "long",
          year: "numeric"
        }
      )
      .toUpperCase();

  };


/* =========================================================
   FIGHT DATE DISPLAY
========================================================= */

window.MRS_WOLFIE_BUILD_DATE_DISPLAY =
  function(fight) {

    if (!fight) {
      return "";
    }

    if (fight.dateDisplay) {
      return fight.dateDisplay;
    }

    const start =
      window.MRS_WOLFIE_FORMAT_DATE(
        fight.date
      );

    if (!fight.dateEnd) {
      return start;
    }

    const startDate =
      window.MRS_WOLFIE_CREATE_DATE(
        fight.date
      );

    const endDate =
      window.MRS_WOLFIE_CREATE_DATE(
        fight.dateEnd
      );

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return start;
    }

    /*
      Same month/year:
      20/21 NOVEMBER 2026
    */

    if (
      startDate.getMonth() === endDate.getMonth() &&
      startDate.getFullYear() === endDate.getFullYear()
    ) {

      const monthYear =
        endDate
          .toLocaleDateString(
            "en-GB",
            {
              month: "long",
              year: "numeric"
            }
          )
          .toUpperCase();

      return (
        String(startDate.getDate()).padStart(2, "0") +
        "/" +
        String(endDate.getDate()).padStart(2, "0") +
        " " +
        monthYear
      );

    }

    return (
      window.MRS_WOLFIE_FORMAT_DATE(fight.date) +
      " — " +
      window.MRS_WOLFIE_FORMAT_DATE(fight.dateEnd)
    );

  };


/* =========================================================
   RESULT HELPER
========================================================= */

window.MRS_WOLFIE_HAS_RESULT =
  function(fight) {

    if (!fight) {
      return false;
    }

    const result =
      String(
        fight.result || ""
      )
        .trim()
        .toUpperCase();

    return (
      result === "W" ||
      result === "L" ||
      result === "D"
    );

  };


/* =========================================================
   CANCELLED FIGHT HELPER
========================================================= */

window.MRS_WOLFIE_IS_CANCELLED =
  function(fight) {

    if (!fight) {
      return false;
    }

    return (
      String(
        fight.status || ""
      )
        .trim()
        .toUpperCase()
      ===
      "CANCELLED"
    );

  };


/* =========================================================
   FIGHT FINAL DATE
========================================================= */

window.MRS_WOLFIE_GET_FINAL_DATE =
  function(fight) {

    if (!fight) {
      return null;
    }

    const finalDateString =
      fight.dateEnd ||
      fight.date;

    if (!finalDateString) {
      return null;
    }

    const finalDate =
      window.MRS_WOLFIE_CREATE_DATE(
        finalDateString
      );

    if (
      Number.isNaN(
        finalDate.getTime()
      )
    ) {
      return null;
    }

    finalDate.setHours(
      23,
      59,
      59,
      999
    );

    return finalDate;

  };


/* =========================================================
   TODAY
========================================================= */

window.MRS_WOLFIE_GET_TODAY =
  function() {

    const now =
      new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

  };


/* =========================================================
   SORT FIGHTS
========================================================= */

window.MRS_WOLFIE_SORT_FIGHTS =
  function() {

    window.MRS_WOLFIE_FIGHTS.upcoming.sort(
      (a, b) => {

        return (
          window.MRS_WOLFIE_CREATE_DATE(a.date) -
          window.MRS_WOLFIE_CREATE_DATE(b.date)
        );

      }
    );

  };


/* =========================================================
   AUTOMATIC NEXT FIGHT
========================================================= */

window.MRS_WOLFIE_GET_NEXT_FIGHT =
  function() {

    const fights =
      window.MRS_WOLFIE_FIGHTS.upcoming;

    const today =
      window.MRS_WOLFIE_GET_TODAY();

    const nextFight =
      fights.find(
        (fight) => {

          if (
            window.MRS_WOLFIE_HAS_RESULT(
              fight
            )
          ) {
            return false;
          }

          if (
            window.MRS_WOLFIE_IS_CANCELLED(
              fight
            )
          ) {
            return false;
          }

          const finalDate =
            window.MRS_WOLFIE_GET_FINAL_DATE(
              fight
            );

          if (!finalDate) {
            return false;
          }

          return (
            finalDate >= today
          );

        }
      );

    return nextFight || null;

  };


/* =========================================================
   UPDATE CURRENT NEXT FIGHT
========================================================= */

window.MRS_WOLFIE_REFRESH_NEXT_FIGHT =
  function() {

    window.MRS_WOLFIE_SORT_FIGHTS();

    window.MRS_WOLFIE_FIGHTS.nextFight =
      window.MRS_WOLFIE_GET_NEXT_FIGHT();

  };


/* =========================================================
   ACTIVE UPCOMING FIGHTS
========================================================= */

window.MRS_WOLFIE_GET_UPCOMING_FIGHTS =
  function() {

    const today =
      window.MRS_WOLFIE_GET_TODAY();

    return (

      window.MRS_WOLFIE_FIGHTS.upcoming

        .filter(
          (fight) => {

            if (
              window.MRS_WOLFIE_HAS_RESULT(
                fight
              )
            ) {
              return false;
            }

            if (
              window.MRS_WOLFIE_IS_CANCELLED(
                fight
              )
            ) {
              return false;
            }

            const finalDate =
              window.MRS_WOLFIE_GET_FINAL_DATE(
                fight
              );

            if (!finalDate) {
              return false;
            }

            return (
              finalDate >= today
            );

          }
        )

        .sort(
          (a, b) => {

            return (
              window.MRS_WOLFIE_CREATE_DATE(a.date) -
              window.MRS_WOLFIE_CREATE_DATE(b.date)
            );

          }
        )

    );

  };


/* =========================================================
   COMPLETED FIREBASE / ANNOUNCED FIGHTS
========================================================= */

window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS =
  function() {

    return (

      window.MRS_WOLFIE_FIGHTS.upcoming

        .filter(
          (fight) => {

            return (
              !window.MRS_WOLFIE_IS_CANCELLED(fight) &&
              window.MRS_WOLFIE_HAS_RESULT(fight)
            );

          }
        )

    );

  };


/* =========================================================
   COMPLETE FIGHT HISTORY
========================================================= */

window.MRS_WOLFIE_GET_FIGHT_HISTORY =
  function() {

    const permanentHistory =
      window.MRS_WOLFIE_FIGHTS.history;

    const newlyCompleted =
      window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS();

    const combinedHistory = [
      ...permanentHistory,
      ...newlyCompleted
    ];

    const uniqueFights = [];

    const usedIds =
      new Set();

    combinedHistory.forEach(
      (fight) => {

        const fightId =

          fight.id ||

          [
            fight.date,
            fight.opponent,
            fight.promotion
          ]
            .join("-")
            .toLowerCase();

        if (
          usedIds.has(
            fightId
          )
        ) {
          return;
        }

        usedIds.add(
          fightId
        );

        uniqueFights.push(
          fight
        );

      }
    );

    uniqueFights.sort(
      (a, b) => {

        return (
          window.MRS_WOLFIE_CREATE_DATE(b.date) -
          window.MRS_WOLFIE_CREATE_DATE(a.date)
        );

      }
    );

    return uniqueFights;

  };


/* =========================================================
   FIGHT RECORD
========================================================= */

window.MRS_WOLFIE_GET_FIGHT_RECORD =
  function() {

    const history =
      window.MRS_WOLFIE_GET_FIGHT_HISTORY();

    let wins = 0;
    let losses = 0;
    let draws = 0;

    history.forEach(
      (fight) => {

        const result =
          String(
            fight.result || ""
          )
            .trim()
            .toUpperCase();

        if (result === "W") {
          wins += 1;
        }

        else if (result === "L") {
          losses += 1;
        }

        else if (result === "D") {
          draws += 1;
        }

      }
    );

    return {

      wins: wins,

      losses: losses,

      draws: draws,

      total:
        wins +
        losses +
        draws

    };

  };


/* =========================================================
   FIND FIGHT BY ID
========================================================= */

window.MRS_WOLFIE_GET_FIGHT_BY_ID =
  function(fightId) {

    if (!fightId) {
      return null;
    }

    const allFights = [
      ...window.MRS_WOLFIE_FIGHTS.upcoming,
      ...window.MRS_WOLFIE_FIGHTS.history
    ];

    return (

      allFights.find(
        (fight) => {

          return (
            fight.id === fightId
          );

        }
      )

      ||

      null

    );

  };


/* =========================================================
   INITIAL LOCAL DATABASE SETUP
========================================================= */

window.MRS_WOLFIE_REFRESH_NEXT_FIGHT();


/* =========================================================
   FIREBASE / CLOUD FIRESTORE
========================================================= */

/*
  Firestore is loaded as a module separately from the
  normal app scripts.

  Until it finishes, the local fallback fights remain
  available.

  When Firebase successfully loads:

  1. Firebase replaces the announced-fight array.
  2. The fights are sorted.
  3. Next Fight is recalculated.
  4. A custom event tells every page that live fight
     data is ready.
*/

(async function loadMrsWolfieFirebaseFights() {

  try {

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


    const app =
      getApps().length
        ? getApp()
        : initializeApp(
            firebaseConfig
          );


    const db =
      getFirestore(
        app
      );


    const fightsCollection =
      collection(
        db,
        "mrsWolfieFights"
      );


    onSnapshot(

      fightsCollection,

      (snapshot) => {

        const firebaseFights = [];


        snapshot.forEach(
          (fightDocument) => {

            const data =
              fightDocument.data();


            /*
              Admin notes are deliberately not copied
              into the public app's fight objects.
            */

            const fight = {

              id:
                fightDocument.id,

              promotion:
                String(
                  data.promotion || ""
                ).trim(),

              event:
                String(
                  data.event || ""
                ).trim(),

              opponent:
                String(
                  data.opponent || ""
                ).trim(),

              date:
                String(
                  data.date || ""
                ).trim(),

              dateEnd:
                String(
                  data.dateEnd || ""
                ).trim(),

              venue:
                String(
                  data.venue || ""
                ).trim(),

              status:
                String(
                  data.status || "UPCOMING"
                )
                  .trim()
                  .toUpperCase(),

              type:
                String(
                  data.type || "FIGHT NIGHT"
                )
                  .trim()
                  .toUpperCase(),

              result:
                String(
                  data.result || ""
                )
                  .trim()
                  .toUpperCase()

            };


            fight.dateDisplay =
              window.MRS_WOLFIE_BUILD_DATE_DISPLAY(
                fight
              );


            firebaseFights.push(
              fight
            );

          }
        );


        /*
          IMPORTANT:

          Once Firebase has successfully responded,
          Firebase becomes the authoritative announced
          fight database.

          Even an empty Firebase collection is valid.
          This means deleting all fights in Admin will
          correctly remove them from the public app.
        */

        window.MRS_WOLFIE_FIGHTS.upcoming =
          firebaseFights;


        window.MRS_WOLFIE_FIGHTS.source =
          "FIREBASE";


        window.MRS_WOLFIE_FIGHTS.firebaseLoaded =
          true;


        window.MRS_WOLFIE_REFRESH_NEXT_FIGHT();


        /*
          Tell the rest of the app to redraw itself.
        */

        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieFightDataUpdated",
            {
              detail: {
                source: "FIREBASE",
                fights:
                  firebaseFights.length
              }
            }
          )
        );


        console.log(
          "Mrs Wolfie live fight data loaded:",
          firebaseFights.length,
          "fight(s)."
        );

      },


      (error) => {

        console.error(
          "Mrs Wolfie Firebase fight listener failed. Using local fallback data.",
          error
        );


        window.MRS_WOLFIE_FIGHTS.source =
          "LOCAL FALLBACK";


        window.MRS_WOLFIE_FIGHTS.firebaseLoaded =
          false;


        window.MRS_WOLFIE_REFRESH_NEXT_FIGHT();


        window.dispatchEvent(
          new CustomEvent(
            "mrsWolfieFightDataUpdated",
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

  catch (error) {

    console.error(
      "Mrs Wolfie Firebase could not start. Using local fallback data.",
      error
    );


    window.MRS_WOLFIE_FIGHTS.source =
      "LOCAL FALLBACK";


    window.MRS_WOLFIE_FIGHTS.firebaseLoaded =
      false;


    window.MRS_WOLFIE_REFRESH_NEXT_FIGHT();


    window.dispatchEvent(
      new CustomEvent(
        "mrsWolfieFightDataUpdated",
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
