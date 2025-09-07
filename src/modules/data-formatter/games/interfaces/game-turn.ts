import { GameTurnStage } from "src/models/game-turn.model";
import { IPlayer } from "./player";

export interface IGameTurn {
    id: string,
    player: IPlayer,
    stage: GameTurnStage,
    expires: number,
    updatedAt: Date
}