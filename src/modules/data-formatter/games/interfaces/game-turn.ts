import { GameTurnStage } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "../../players/interfaces/player";
import { IGamePayment } from "../../game-payments/interfaces/game-payment";
import { IActionCard } from "../../action-cards/interfaces/action-card";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    actionCard: IActionCard | null,
    gamePayments: IGamePayment[] | null,
    expires: number,
    updatedAt: Date
}