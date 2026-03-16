import { PlayerChip } from "src/modules/players/model/player"
import { IUser } from "../../users/interfaces/user"
import { IPlayerCard } from "../../player-cards/interfaces/player-card"

export interface IPlayer {
    id: string,
    user: IUser,
    chip: PlayerChip,
    isActive: boolean
    turnNumber: number,
    balance: number,
    cards: IPlayerCard[]
}