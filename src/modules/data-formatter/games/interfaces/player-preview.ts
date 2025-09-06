import { PlayerChip, PlayerStatus } from "src/models/player.model";
import { IUser } from "../../interfaces/user";

export interface IPlayerPreview {
    id: string,
    user: IUser,
    chip: PlayerChip,
    status: PlayerStatus
}