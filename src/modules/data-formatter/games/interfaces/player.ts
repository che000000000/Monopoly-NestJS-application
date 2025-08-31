import { PlayerChip } from "src/models/player.model";
import { IUser } from "../../interfaces/user";

export interface IPlayer {
    id: string,
    user: IUser | null,
    chip: PlayerChip
    status: string
    turnNumber: number,
    balance: number
}