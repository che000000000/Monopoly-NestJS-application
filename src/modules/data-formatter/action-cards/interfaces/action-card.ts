import { ActionCardDeckType, ActionCardType } from "src/modules/action-cards/model/action-card";

export interface IActionCard {
    id: string,
    description: string,
    deckType: ActionCardDeckType,
    type: ActionCardType
}