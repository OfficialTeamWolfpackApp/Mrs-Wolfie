
/* MRS WOLFIE — LIVE UPDATES DATABASE */

window.MRS_WOLFIE_UPDATES = {
  updates: [],
  firebaseLoaded: false,
  error: false,
  timedOut: false,
  source: "FIREBASE"
};

const updateEvent = "mrsWolfieUpdatesDataUpdated";

function notifyUpdatesChanged() {
  window.dispatchEvent(new CustomEvent(updateEvent));
}

window.MRS_WOLFIE_GET_UPDATE_DATE = function(update) {
  const value = String(update?.date || "");
  const time = Date.parse(value + "T12:00:00");
  return Number.isFinite(time) ? time : 0;
};

window.MRS_WOLFIE_FORMAT_UPDATE_DATE = function(value) {
  if (!value) return "";
  const date = new Date(String(value) + "T12:00:00");
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).toUpperCase();
};

window.MRS_WOLFIE_GET_RESULT_WORD = function(result) {
  return { W: "WIN", L: "LOSS", D: "DRAW" }[
    String(result || "").toUpperCase()
  ] || "";
};

window.MRS_WOLFIE_GET_RESULT_UPDATES = function() {
  const getter = window.MRS_WOLFIE_GET_COMPLETED_ANNOUNCED_FIGHTS;
  if (typeof getter !== "function") return [];

  let fights;
  try {
    fights = getter();
  } catch (error) {
    console.warn("Could not load fight results:", error);
    return [];
  }

  if (!Array.isArray(fights)) return [];

  return fights
    .filter(fight =>
      ["W", "L", "D"].includes(
        String(fight.result || "").toUpperCase()
      )
    )
    .map(fight => {
      const result = String(fight.result).toUpperCase();
      const opponent = fight.opponent || "her opponent";
      const wording = result === "W"
        ? "Mrs Wolfie records a win against " + opponent + "."
        : result === "L"
          ? "Mrs Wolfie records a loss against " + opponent + "."
          : "Mrs Wolfie's fight against " + opponent +
            " ends in a draw.";

      return {
        id: "fight-result-" + String(fight.id || fight.date || opponent),
        type: "RESULT",
        title: "MRS WOLFIE — " +
          window.MRS_WOLFIE_GET_RESULT_WORD(result),
        message: wording,
        date: fight.date || "",
        dateDisplay: window.MRS_WOLFIE_FORMAT_UPDATE_DATE(
          fight.date || ""
        ),
        active: true
      };
    });
};

window.MRS_WOLFIE_GET_ALL_UPDATES = function() {
  const manual = window.MRS_WOLFIE_UPDATES.updates || [];
  const results = window.MRS_WOLFIE_GET_RESULT_UPDATES();
  const seen = new Set();

  return [...manual, ...results].filter(update => {
    if (!update) return false;
    const id = String(
      update.id ||
      [update.type, update.title, update.date].join("-")
    );
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

window.MRS_WOLFIE_GET_ACTIVE_UPDATES = function() {
  return window.MRS_WOLFIE_GET_ALL_UPDATES()
    .filter(update => update.active === true)
    .sort((a, b) =>
      window.MRS_WOLFIE_GET_UPDATE_DATE(b) -
      window.MRS_WOLFIE_GET_UPDATE_DATE(a)
    );
};

window.MRS_WOLFIE_GET_LATEST_UPDATE = function() {
  return window.MRS_WOLFIE_GET_ACTIVE_UPDATES()[0] || null;
};

window.MRS_WOLFIE_GET_ACTIVE_RESULT_UPDATES = function() {
  return window.MRS_WOLFIE_GET_ACTIVE_UPDATES()
    .filter(update => update.type === "RESULT");
};

const updatesTimeout = setTimeout(() => {
  if (
    !window.MRS_WOLFIE_UPDATES.firebaseLoaded &&
    !window.MRS_WOLFIE_UPDATES.error
  ) {
    window.MRS_WOLFIE_UPDATES.timedOut = true;
    notifyUpdatesChanged();
  }
}, 12000);

(async function loadMrsWolfieUpdates() {
  try {
    const appModule = await import(
      "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js"
    );

    const firestoreModule = await import(
      "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js"
    );

    const firebaseConfig = {
      apiKey: "AIzaSyC06RDrqpXodbYBJqyeGvRkmtxQGapaaPY",
      authDomain: "team-wolfpack-app.firebaseapp.com",
      databaseURL:
        "https://team-wolfpack-app-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "team-wolfpack-app",
      storageBucket: "team-wolfpack-app.firebasestorage.app",
      messagingSenderId: "1070414578856",
      appId: "1:1070414578856:web:df14e7d387e658eeae2e9d",
      measurementId: "G-6JTCE2N9LZ"
    };

    const app = appModule.getApps().length
      ? appModule.getApp()
      : appModule.initializeApp(firebaseConfig);

    const db = firestoreModule.getFirestore(app);

    const updatesQuery = firestoreModule.query(
      firestoreModule.collection(db, "mrsWolfieUpdates"),
      firestoreModule.where("active", "==", true)
    );

    firestoreModule.onSnapshot(
      updatesQuery,
      snapshot => {
        const updates = [];

        snapshot.forEach(doc => {
          const data = doc.data() || {};
          const date = String(data.date || "").trim();

          const position = value => {
            const number = Number(value);
            return Number.isFinite(number)
              ? Math.max(0, Math.min(100, number))
              : 50;
          };

          const zoom = Number(data.imageZoom ?? 100);

          updates.push({
            id: doc.id,
            type: String(data.type || "NEWS").toUpperCase(),
            title: String(data.title || "MRS WOLFIE UPDATE"),
            message: String(data.message || ""),
            date,
            dateDisplay: String(
              data.dateDisplay ||
              window.MRS_WOLFIE_FORMAT_UPDATE_DATE(date)
            ),
            imageUrl: String(data.imageUrl || ""),
            imageRatio: String(data.imageRatio || "full"),
            imagePositionX: position(data.imagePositionX ?? 50),
            imagePositionY: position(data.imagePositionY ?? 50),
            imageZoom: Number.isFinite(zoom)
              ? Math.max(100, Math.min(200, zoom))
              : 100,
            buttonText: String(data.buttonText || ""),
            link: String(data.link || ""),
            active: true
          });
        });

        window.MRS_WOLFIE_UPDATES.updates = updates;
        window.MRS_WOLFIE_UPDATES.firebaseLoaded = true;
        window.MRS_WOLFIE_UPDATES.error = false;
        window.MRS_WOLFIE_UPDATES.timedOut = false;
        clearTimeout(updatesTimeout);
        notifyUpdatesChanged();
      },
      error => {
        console.error("Mrs Wolfie updates Firebase error:", error);
        window.MRS_WOLFIE_UPDATES.error = true;
        window.MRS_WOLFIE_UPDATES.timedOut = false;
        clearTimeout(updatesTimeout);
        notifyUpdatesChanged();
      }
    );
  } catch (error) {
    console.error("Mrs Wolfie updates failed to initialise:", error);
    window.MRS_WOLFIE_UPDATES.error = true;
    window.MRS_WOLFIE_UPDATES.timedOut = false;
    clearTimeout(updatesTimeout);
    notifyUpdatesChanged();
  }
})();
