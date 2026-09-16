/* =========================================================
   MRS WOLFIE BOXING APP
   CENTRAL APP UPDATES / NEWS DATABASE
========================================================= */

window.MRS_WOLFIE_UPDATES = {


  /* =======================================================
     APP UPDATES

     Put the newest update FIRST.

     Available types:

     "FIGHT"
     "NEWS"
     "IMPORTANT"
     "RESULT"
     "TEAM"

     active: true
     = show the update in the app

     active: false
     = keep the update saved but hide it
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
   GET ACTIVE UPDATES
========================================================= */

window.MRS_WOLFIE_GET_ACTIVE_UPDATES =
  function() {


    const updates =
      window.MRS_WOLFIE_UPDATES.updates;


    return updates
      .filter(
        (update) =>
          update.active === true
      )
      .sort(
        (a, b) => {


          return (
            new Date(b.date) -
            new Date(a.date)
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
