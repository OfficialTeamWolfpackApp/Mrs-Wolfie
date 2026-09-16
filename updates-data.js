/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL APP UPDATES / NEWS DATABASE
========================================================= */

window.MRS_WOLFIE_UPDATES = {


  /* =======================================================
     MANUAL APP UPDATES

     Put the newest manual update FIRST.

     Available types:

     "FIGHT"
     "NEWS"
     "IMPORTANT"
     "RESULT"
     "TEAM"

     active: true
     = show the update

     active: false
     = keep it saved but hide it

     IMPORTANT:

     Fight RESULT updates do NOT need to be manually
     added here.

     They are automatically created from fight-data.js
     when a fight receives:

     result: "W"
     result: "L"
     result: "D"
  ======================================================== */

  updates: [


    /* -------------------------------------------------------
       NEXT FIGHT
    -------------------------------------------------------- */

    {

      id:
        "fight-17-oct-2026",

      type:
        "FIGHT",

      title:
        "NEXT FIGHT CONFIRMED",

      message:
        "Mrs Wolfie faces Colleen Leyden at Ayrshire Boxing: The Launch.",

      date:
        "2026-09-16",

      dateDisplay:
        "16 SEPTEMBER 2026",

      buttonText:
        "VIEW FIGHT",

      link:
        "./fight.html",

      active:
        true

    },



    /* -------------------------------------------------------
       APP UPDATE
    -------------------------------------------------------- */

    {

      id:
        "mrs-wolfie-app",

      type:
        "NEWS",

      title:
        "MRS WOLFIE APP",

      message:
        "Welcome to the official Mrs Wolfie boxing app. Follow fight nights, upcoming fights, results and the latest Mrs Wolfie updates.",

      date:
        "2026-09-16",

      dateDisplay:
        "16 SEPTEMBER 2026",

      buttonText:
        "",

      link:
        "",

      active:
        true

    }


  ]


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

/*
  Reads the completed announced fights from fight-data.js.

  Example:

  result: "W"

  automatically creates:

  RESULT
  FIGHT RESULT — WIN
  Mrs Wolfie defeated Colleen Leyden...
*/

window.MRS_WOLFIE_GET_RESULT_UPDATES =
  function() {


    /*
      fight-data.js must be loaded before this file.

      If it is unavailable, simply return no automatic
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
      (fight) => {


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



        /* -----------------------------------------------------
           RESULT MESSAGE
        ------------------------------------------------------ */

        let resultMessage = "";


        if (
          resultCode === "W"
        ) {


          resultMessage =
            "Mrs Wolfie records a win against " +
            (fight.opponent || "her opponent") +
            ".";


        }


        else if (
          resultCode === "L"
        ) {


          resultMessage =
            "Mrs Wolfie records a loss against " +
            (fight.opponent || "her opponent") +
            ".";


        }


        else if (
          resultCode === "D"
        ) {


          resultMessage =
            "Mrs Wolfie's fight against " +
            (fight.opponent || "her opponent") +
            " ends in a draw.";


        }



        /* -----------------------------------------------------
           EVENT INFORMATION
        ------------------------------------------------------ */

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



        /* -----------------------------------------------------
           AUTOMATIC UPDATE
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


          /*
            Use the fight date so the result appears
            in the correct chronological position.
          */

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


          /*
            Extra information is available if we want
            special RESULT card styling later.
          */

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

/*
  Combines:

  1. Manual news / announcements
  2. Automatic fight-result updates
*/

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

    const uniqueUpdates = [];


    const usedIds =
      new Set();



    combinedUpdates.forEach(
      (update) => {


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
        (update) => {


          return (
            update.active === true
          );


        }
      )

      .sort(
        (a, b) => {


          return (

            window.MRS_WOLFIE_GET_UPDATE_DATE(
              b
            ) -

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
          (update) => {


            return (
              update.type ===
              "RESULT"
            );


          }
        )

    );


  };
