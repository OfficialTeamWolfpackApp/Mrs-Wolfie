/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL FIGHT DATABASE
========================================================= */

window.MRS_WOLFIE_FIGHTS = {


  /* =======================================================
     UPCOMING / ANNOUNCED FIGHTS

     Add new fights here in date order.

     The app automatically selects the first fight
     that has not finished as the NEXT FIGHT.
  ======================================================== */

  upcoming: [


    /* -------------------------------------------------------
       17 OCTOBER 2026
    -------------------------------------------------------- */

    {

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
        "FIGHT NIGHT"

    },



    /* -------------------------------------------------------
       20 / 21 NOVEMBER 2026
    -------------------------------------------------------- */

    {

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
        "TITLE FIGHT"

    }


  ],



  /* =======================================================
     FIGHT HISTORY
  ======================================================== */

  history: [


    /* -------------------------------------------------------
       14 MARCH 2026
    -------------------------------------------------------- */

    {

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
   DATE HELPERS
========================================================= */

/*
  Converts one of our YYYY-MM-DD fight dates
  into a local Date object.

  Midday is used for comparison so normal
  timezone changes around midnight do not
  accidentally move the calendar date.
*/

window.MRS_WOLFIE_CREATE_DATE =
  function(dateString) {


    return new Date(
      dateString +
      "T12:00:00"
    );


  };



/* =========================================================
   SORT UPCOMING FIGHTS
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
  This automatically determines which announced
  fight should be treated as the next fight.

  For a multi-day event such as 20/21 November,
  dateEnd is used as the final event date.
*/

window.MRS_WOLFIE_GET_NEXT_FIGHT =
  function() {


    const fights =
      window.MRS_WOLFIE_FIGHTS.upcoming;


    const now =
      new Date();


    /*
      Start of today's local calendar day.
    */

    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );


    const nextFight =
      fights.find(
        (fight) => {


          const finalDateString =
            fight.dateEnd ||
            fight.date;


          const finalDate =
            window.MRS_WOLFIE_CREATE_DATE(
              finalDateString
            );


          /*
            Keep the fight as current throughout
            its final listed calendar date.
          */

          finalDate.setHours(
            23,
            59,
            59,
            999
          );


          return (
            finalDate >= today
          );


        }
      );


    /*
      If every announced fight has passed,
      return null rather than displaying an
      old fight as if it were upcoming.
    */

    return nextFight || null;


  };



/* =========================================================
   SET CURRENT NEXT FIGHT
========================================================= */

window.MRS_WOLFIE_FIGHTS.nextFight =
  window.MRS_WOLFIE_GET_NEXT_FIGHT();



/* =========================================================
   HELPER: FUTURE / CURRENT UPCOMING FIGHTS
========================================================= */

/*
  This gives Schedule a filtered list.

  Once a fight's final listed date has passed,
  it can stop appearing under UPCOMING FIGHTS.
*/

window.MRS_WOLFIE_GET_UPCOMING_FIGHTS =
  function() {


    const now =
      new Date();


    const today =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );


    return (
      window.MRS_WOLFIE_FIGHTS.upcoming
        .filter(
          (fight) => {


            const finalDateString =
              fight.dateEnd ||
              fight.date;


            const finalDate =
              window.MRS_WOLFIE_CREATE_DATE(
                finalDateString
              );


            finalDate.setHours(
              23,
              59,
              59,
              999
            );


            return (
              finalDate >= today
            );


          }
        )
    );


  };
