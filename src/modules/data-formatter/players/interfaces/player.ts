import { PlayerChip, PlayerStatus } from "src/modules/players/model/player"
import { IUser } from "../../users/interfaces/user"

export interface IPlayer {
    id: string,
    user: IUser,
    chip: PlayerChip,
    status: PlayerStatus
    turnNumber: number,
    balance: number
}