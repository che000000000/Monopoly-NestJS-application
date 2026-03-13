import { IPlayerPreview } from "../../players/interfaces/player-preview";

export interface IGamePreview {
    id: string,
    players: IPlayerPreview[],
    createdAt: string
}