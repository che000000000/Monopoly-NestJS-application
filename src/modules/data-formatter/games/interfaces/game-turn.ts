import { GameTurnStage } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "./player";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    expires: number,
    updatedAt: Date
}