import { IPlayer } from "./player";

export interface IGame {
    id: string,
    players: IPlayer[],
    createdAt: Date
}