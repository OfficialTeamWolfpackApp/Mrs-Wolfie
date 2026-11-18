/*
=========================================================
MRS WOLFIE - PRIVATE NOTE REQUEST GUARD
=========================================================

Prevents outdated asynchronous private note responses
from updating a different editing context.

No Firebase imports.
No database reads or writes.
No changes to fight editor mode.
=========================================================
*/

export function createPrivateNoteRequestGuard() {

  let generation = 0;
  let activeFightId = null;
  let activeRequest = null;

  function begin(fightId) {

    if (
      typeof fightId !== "string" ||
      !fightId.trim()
    ) {
      throw new Error(
        "A valid fight ID is required."
      );
    }

    generation += 1;
    activeFightId = fightId;

    const request = Object.freeze({
      fightId,
      generation
    });

    activeRequest = request;

    return request;
  }

  function isCurrent(request, editingFightId) {

    if (
      !request ||
      typeof request !== "object" ||
      typeof request.fightId !== "string" ||
      !Number.isSafeInteger(request.generation)
    ) {
      return false;
    }

    return (
      activeRequest === request &&
      activeFightId === request.fightId &&
      editingFightId === request.fightId &&
      request.generation === generation
    );
  }

  function invalidate() {

    generation += 1;
    activeFightId = null;
    activeRequest = null;

    return generation;
  }

  function getState() {

    return Object.freeze({
      generation,
      activeFightId,
      hasActiveRequest: activeRequest !== null
    });
  }

  return Object.freeze({
    begin,
    isCurrent,
    invalidate,
    getState
  });
}