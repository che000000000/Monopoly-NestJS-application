import { GameTurnStage } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "./player";
import { IActionCard } from "./action-card";
import { IGamePayment } from "./game-payment";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    actionCard: IActionCard | null,
    gamePayment: IGamePayment | null,
    expires: number,
    updatedAt: Date
}