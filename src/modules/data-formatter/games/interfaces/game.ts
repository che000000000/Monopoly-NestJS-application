import { IPlayer } from "../../players/interfaces/player";

export interface IGame {
    id: string,
    players: IPlayer[],
    createdAt: Date
}