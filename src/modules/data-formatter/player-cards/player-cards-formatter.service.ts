import { Injectable } from "@nestjs/common";
import { PlayerCard } from "src/modules/player-cards/model/player-card.model";
import { IPlayerCard } from "./interfaces/player-card";

@Injectable()
export class PlayerCardsFormatterService {
    formatPlayerCard(playerCard: PlayerCard): IPlayerCard {
        return {
            id: playerCard.id,
            type: playerCard.type
        }
    }

    formatPlayerCards(playerCards: PlayerCard[]): IPlayerCard[] {
        return playerCards.map(pc => this.formatPlayerCard(pc))
    }
}