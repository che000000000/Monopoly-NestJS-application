import { Player } from "./player.interface";

export interface NewGame {
    id: string,
    players: Player[],
    createdAt: Date
}