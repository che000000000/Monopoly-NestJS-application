import { GameTurnStage, MovementType } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "../../players/interfaces/player";
import { IActionCard } from "../../action-cards/interfaces/action-card";
import { IGamePayment } from "../../game-payments/interfaces/game-payment";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    movementType: MovementType,
    actionCard: IActionCard | null,
    gamePayments: IGamePayment[],
    expires: number,
    updatedAt: Date
}