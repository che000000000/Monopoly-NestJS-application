import { ActionCard } from "src/modules/action-cards/model/action-card";
import { IActionCard } from "./interfaces/action-card";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ActionCardsFormatterService {
    formatActionCard(actionCard: ActionCard): IActionCard {
        return {
            id: actionCard.id,
            description: actionCard.description,
            deckType: actionCard.deckType,
            type: actionCard.type
        }
    }
}