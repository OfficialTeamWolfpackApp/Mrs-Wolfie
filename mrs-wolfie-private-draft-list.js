/*
  MRS WOLFIE - PRIVATE DRAFT LIST MANAGER

  LOCAL DEVELOPMENT ONLY

  This module renders draft information supplied
  by the caller.

  It does not connect to Firebase, load private
  records, upload images or publish fights.

  All management actions remain disabled.
*/

const PRIVATE_DRAFT_ACTIONS_ENABLED = false;

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined && text !== null) {
    element.textContent = String(text);
  }

  return element;
}

function formatDraftDate(value) {
  if (!value) {
    return "DATE TO BE CONFIRMED";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "DATE TO BE CONFIRMED";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

function createDisabledButton(label, action, draftId) {
  const button = createElement(
    "button",
    "private-draft-action",
    label
  );

  button.type = "button";
  button.dataset.action = action;

  if (typeof draftId === "string" &&
      /^[A-Za-z0-9_-]{1,128}$/.test(draftId)) {
    button.dataset.draftId = draftId;
  }

  button.disabled = true;

  return button;
}

export function createPrivateDraftCard(draft) {
  if (!draft || typeof draft !== "object") {
    throw new Error("Invalid private draft.");
  }

  const data = draft.data ?? draft;

  const card = createElement(
    "article",
    "private-draft-card"
  );

  const header = createElement(
    "div",
    "private-draft-card-header"
  );

  const title = createElement(
    "h4",
    "private-draft-card-title",
    data.opponent || "TBA"
  );

  const badge = createElement(
    "span",
    "private-draft-card-badge",
    "PRIVATE DRAFT"
  );

  header.append(title, badge);

  const details = createElement(
    "div",
    "private-draft-card-details"
  );

  const fields = [
    ["DATE", formatDraftDate(data.fightDate)],
    ["PROMOTION", data.promotion || "TBA"],
    ["EVENT", data.event || "TBA"],
    ["VENUE", data.venue || "TBA"],
    ["FIGHT TYPE", data.fightType || "TBA"],
    ["TITLE", data.fightTitle || "NOT SPECIFIED"],
    ["STATUS", data.fightStatus || "UPCOMING"]
  ];

  for (const [label, value] of fields) {
    const row = createElement(
      "div",
      "private-draft-detail-row"
    );

    const labelElement = createElement(
      "strong",
      "",
      label
    );

    const valueElement = createElement(
      "span",
      "",
      value
    );

    row.append(labelElement, valueElement);
    details.append(row);
  }

  const actions = createElement(
    "div",
    "private-draft-card-actions"
  );

  actions.append(
    createDisabledButton("EDIT DRAFT", "edit", draft.id),
    createDisabledButton("DELETE DRAFT", "delete", draft.id),
    createDisabledButton("PUBLISH FIGHT", "publish", draft.id)
  );

  card.append(header, details, actions);

  return card;
}

export function renderPrivateDraftList(
  container,
  drafts = []
) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("Invalid private draft container.");
  }

  if (!Array.isArray(drafts)) {
    throw new Error("Private drafts must be an array.");
  }

  const list = container.querySelector(
    ".private-draft-list"
  );

  if (!list) {
    throw new Error("Private draft list element missing.");
  }

  list.replaceChildren();

  if (drafts.length === 0) {
    const empty = createElement(
      "div",
      "private-draft-empty"
    );

    empty.append(
      createElement(
        "h4",
        "",
        "NO PRIVATE DRAFTS DISPLAYED"
      ),
      createElement(
        "p",
        "",
        "Private draft loading is not enabled."
      )
    );

    list.append(empty);

    return;
  }

  for (const draft of drafts) {
    list.append(createPrivateDraftCard(draft));
  }
}

export function privateDraftListReady() {
  return PRIVATE_DRAFT_ACTIONS_ENABLED;
}