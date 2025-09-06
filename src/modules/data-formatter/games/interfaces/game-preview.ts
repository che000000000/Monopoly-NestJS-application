import { IPlayerPreview } from "./player-preview";

export interface IGamePreview {
    id: string,
    players: IPlayerPreview[],
    createdAt: string
}