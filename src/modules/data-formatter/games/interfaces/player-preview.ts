import { PlayerChip, PlayerStatus } from "src/modules/players/model/player";
import { IUser } from "../../interfaces/user";

export interface IPlayerPreview {
    id: string,
    user: IUser,
    chip: PlayerChip,
    status: PlayerStatus
}