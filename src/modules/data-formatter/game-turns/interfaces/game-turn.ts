import { GameTurnStage } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "../../players/interfaces/player";
import { IActionCard } from "../../action-cards/interfaces/action-card";
import { IGamePayment } from "../../game-payments/interfaces/game-payment";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    actionCard: IActionCard | null,
    gamePayments: IGamePayment[] | null,
    expires: number,
    updatedAt: Date
}