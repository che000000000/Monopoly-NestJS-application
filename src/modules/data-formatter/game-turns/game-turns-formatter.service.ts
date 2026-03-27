import { IGameTurn } from "./interfaces/game-turn";
import { FormatGameTurn } from "./interfaces/format-game-turn";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { PlayersService } from "src/modules/players/players.service";
import { ActionCardsService } from "src/modules/action-cards/action-cards.service";
import { GamePaymentsService } from "src/modules/game-payments/game-payments.service";
import { PlayersFormatterService } from "../players/players-formatter.service";
import { ActionCardsFormatterService } from "../action-cards/action-cards-formatter.service";
import { GamePaymentsFormatterService } from "../game-payments/game-payments-formatter.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GameTurnsFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly actionCardsService: ActionCardsService,
        private readonly gamePaymentsService: GamePaymentsService,
        private readonly playersFormatterService: PlayersFormatterService,
        private readonly actionCardsFormatterService: ActionCardsFormatterService,
        private readonly gamePaymentsFormatterService: GamePaymentsFormatterService,
    ) {}

    private formatGameTurn(data: FormatGameTurn): IGameTurn {
        const { gameTurn, player, actionCard, gamePayments } = data

        return {
            id: gameTurn.id,
            player: player,
            stage: gameTurn.stage,
            movementType: gameTurn.movementType,
            actionCard: actionCard ?? null,
            gamePayments: gamePayments ?? [],
            expires: gameTurn.expires,
            updatedAt: gameTurn.updatedAt
        }
    }

    async formatGameTurnAsync(gameTurn: GameTurn): Promise<IGameTurn> {
        const [player, actionCard, gamePayments] = await Promise.all([
            this.playersService.getOneByIdOrThrow(gameTurn.playerId),
            gameTurn.actionCardId ? this.actionCardsService.getOneOrThrow(gameTurn.actionCardId) : null,
            this.gamePaymentsService.findAllByGameTurnId(gameTurn.id),
        ])

        return this.formatGameTurn({
            gameTurn,
            player: await this.playersFormatterService.formatPlayerAsync(player),
            actionCard: actionCard ? this.actionCardsFormatterService.formatActionCard(actionCard) : undefined,
            gamePayments: await this.gamePaymentsFormatterService.formatGamePaymentsAsync(gamePayments),
        })
    }
}