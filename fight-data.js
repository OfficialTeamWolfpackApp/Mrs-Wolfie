/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL FIGHT DATABASE
========================================================= */

window.MRS_WOLFIE_FIGHTS = {


  /* =======================================================
     ANNOUNCED FIGHTS

     Add every newly announced fight here.

     BEFORE THE FIGHT:

     result: ""

     AFTER THE FIGHT:

     result: "W"
     result: "L"
     result: "D"

     Once a result is entered, the app automatically:

     - removes the fight from Upcoming Fights
     - prevents it being selected as Next Fight
     - adds it to Fight History
  ======================================================== */

  upcoming: [

    /* -------------------------------------------------------
       17 OCTOBER 2026
    -------------------------------------------------------- */

    {

      id:
        "fight-17-oct-2026",

      promotion:
        "AYRSHIRE BOXING",

      event:
        "THE LAUNCH",

      opponent:
        "COLLEEN LEYDEN",

      date:
        "2026-10-17",

      dateDisplay:
        "17 OCTOBER 2026",

      venue:
        "AYR RACECOURSE",

      status:
        "UPCOMING",

      type:
        "FIGHT NIGHT",

      result:
        ""

    },



    /* -------------------------------------------------------
       20 / 21 NOVEMBER 2026
    -------------------------------------------------------- */

    {

      id:
        "fight-20-nov-2026",

      promotion:
        "TRAIN4FIGHT",

      event:
        "SUPER MIDDLEWEIGHT TITLE",

      opponent:
        "TBA",

      date:
        "2026-11-20",

      dateEnd:
        "2026-11-21",

      dateDisplay:
        "20/21 NOVEMBER 2026",

      venue:
        "EASTHOUSES MINERS CLUB",

      status:
        "UPCOMING",

      type:
        "TITLE FIGHT",

      result:
        ""

    }


  ],



  /* =======================================================
     EXISTING FIGHT HISTORY

     Previous fights stay here permanently.

     Newly completed fights from the announced-fight
     section are automatically combined with these.
  ======================================================== */

  history: [


    /* -------------------------------------------------------
       14 MARCH 2026
    -------------------------------------------------------- */

    {

      id:
        "fight-14-mar-2026",

      promotion:
        "TRAIN 4 FIGHT PROMOTIONS",

      event:
        "",

      opponent:
        "KATIE FAE THE BING",

      date:
        "2026-03-14",

      dateDisplay:
        "14 MARCH 2026",

      venue:
        "EASTHOUSES MINERS CLUB",

      result:
        "W"

    },



    /* -------------------------------------------------------
       05 JULY 2025
    -------------------------------------------------------- */

    {

      id:
        "fight-05-jul-2025",

      promotion:
        "EBO",

      event:
        "",

      opponent:
        "BRY KELLY",

      date:
        "2025-07-05",

      dateDisplay:
        "05 JULY 2025",

      venue:
        "TRILOGY NIGHTCLUB",

      result:
        "L"

    },



    /* -------------------------------------------------------
       25 MAY 2025
    -------------------------------------------------------- */

    {

      id:
        "fight-25-may-2025",

      promotion:
        "EBO",

      event:
        "",

      opponent:
        "DEMI WISE",

      date:
        "2025-05-25",

      dateDisplay:
        "25 MAY 2025",

      venue:
        "TRILOGY NIGHTCLUB",

      result:
        "L"

    }


  ]


};



/* =========================================================
   DATE HELPER
========================================================= */

/*
  Converts YYYY-MM-DD into a local Date.

  Midday is used to avoid normal timezone changes
  accidentally moving the fight to another calendar day.
*/

window.MRS_WOLFIE_CREATE_DATE =
  function(dateString) {


    if (!dateString) {

      return new Date(
        "Invalid Date"
      );

    }


    return new Date(
      dateString +
      "T12:00:00"
    );


  };



/* =========================================================
   RESULT HELPER
========================================================= */

/*
  A fight is considered completed when it has
  one of the supported result codes.

  W = Win
  L = Loss
  D = Draw
*/

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
   FIGHT FINAL DATE
========================================================= */

/*
  Normal fights use date.

  Multi-day events use dateEnd so the event remains
  active throughout its final listed calendar day.
*/

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
   SORT ANNOUNCED FIGHTS
========================================================= */

window.MRS_WOLFIE_FIGHTS.upcoming.sort(
  (a, b) => {


    return (

      window.MRS_WOLFIE_CREATE_DATE(
        a.date
      ) -

      window.MRS_WOLFIE_CREATE_DATE(
        b.date
      )

    );


  }
);



/* =========================================================
   AUTOMATIC NEXT FIGHT
========================================================= */

/*
  A fight can only become NEXT FIGHT when:

  1. It does not have a result.
  2. Its final event date has not passed.

  Once a result is entered, the app immediately
  skips that fight and selects the next announced fight.
*/

window.MRS_WOLFIE_GET_NEXT_FIGHT =
  function() {


    const fights =
      window.MRS_WOLFIE_FIGHTS.upcoming;


    const today =
      window.MRS_WOLFIE_GET_TODAY();


    const nextFight =
      fights.find(
        (fight) => {


          /*
            Completed fights cannot be Next Fight.
          */

          if (
            window.MRS_WOLFIE_HAS_RESULT(
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
   CURRENT NEXT FIGHT
========================================================= */

window.MRS_WOLFIE_FIGHTS.nextFight =
  window.MRS_WOLFIE_GET_NEXT_FIGHT();



/* =========================================================
   ACTIVE UPCOMING FIGHTS
========================================================= */

/*
  Used by the Schedule page.

  A fight appears under UPCOMING FIGHTS when:

  - it does not have a result
  - its final event date has not passed
*/

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

              window.MRS_WOLFIE_CREATE_DATE(
                a.date
              ) -

              window.MRS_WOLFIE_CREATE_DATE(
                b.date
              )

            );


          }
        )

    );


  };



/* =========================================================
   COMPLETED ANNOUNCED FIGHTS
========================================================= */

/*
  Any fight from the announced-fight section with
  W, L or D entered is treated as completed.
*/

window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS =
  function() {


    return (

      window.MRS_WOLFIE_FIGHTS.upcoming

        .filter(
          (fight) => {


            return (
              window.MRS_WOLFIE_HAS_RESULT(
                fight
              )
            );


          }
        )

    );


  };



/* =========================================================
   COMPLETE FIGHT HISTORY
========================================================= */

/*
  Combines:

  1. Existing historical fights
  2. Newly completed announced fights

  The final list is automatically sorted newest first.

  This means you do NOT need to copy a newly completed
  fight into the history section manually.
*/

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



    /*
      Prevent accidental duplicate fights.

      IDs are used when available.
    */

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

          window.MRS_WOLFIE_CREATE_DATE(
            b.date
          ) -

          window.MRS_WOLFIE_CREATE_DATE(
            a.date
          )

        );


      }
    );


    return uniqueFights;


  };



/* =========================================================
   FIGHT RECORD
========================================================= */

/*
  Automatically calculates Mrs Wolfie's record
  from the complete Fight History.

  Example return value:

  {
    wins: 2,
    losses: 2,
    draws: 0,
    total: 4
  }
*/

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



        if (
          result === "W"
        ) {

          wins += 1;

        }


        else if (
          result === "L"
        ) {

          losses += 1;

        }


        else if (
          result === "D"
        ) {

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

/*
  Allows other parts of the app to retrieve a specific
  fight without duplicating its information.
*/

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
