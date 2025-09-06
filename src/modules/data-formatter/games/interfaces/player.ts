import { IPlayerPreview } from "./player-preview";

export interface IPlayer extends IPlayerPreview {
    turnNumber: number,
    balance: number
}