/*
  MRS WOLFIE - PUBLICATION PREVIEW

  Preview only.
  No Firebase operations.
  No publication.
  No private information exposed.
*/

import {
  convertPrivateDraftToPublicFight
} from "./mrs-wolfie-private-draft-public-converter.js";

export function createPrivateDraftPublicationPreview(draft) {

  const publicFight = convertPrivateDraftToPublicFight(draft);

  const preview = {
    fighterName: publicFight.fighterName,
    team: publicFight.team,

    event: publicFight.event,
    promotion: publicFight.promotion,

    opponent: publicFight.opponent,

    date: publicFight.date,
    displayDate: publicFight.displayDate,

    fightTitle: publicFight.fightTitle,
    fightType: publicFight.fightType,

    venue: publicFight.venue,

    status: publicFight.status,
    result: publicFight.result,

    ticketUrl: publicFight.ticketUrl,

    fighterImage: publicFight.fighterImage,
    opponentImage: publicFight.opponentImage
  };

  return Object.freeze(preview);
}