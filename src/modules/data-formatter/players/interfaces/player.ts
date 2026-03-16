import { PlayerChip } from "src/modules/players/model/player"
import { IUser } from "../../users/interfaces/user"
import { IActionCard } from "../../action-cards/interfaces/action-card"

export interface IPlayer {
    id: string,
    user: IUser,
    chip: PlayerChip,
    isActive: boolean
    turnNumber: number,
    balance: number,
    actionCards: IActionCard[]
}