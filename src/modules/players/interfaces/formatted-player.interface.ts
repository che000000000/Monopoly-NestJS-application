import { PlayerField } from "src/modules/game-fields/interfaces/player-field.interface"
import { FormattedUser } from "src/modules/users/interfaces/formatted-user.interface"

export interface FormattedPlayer {
    id: string,
    turnNumber: number,
    user: FormattedUser | null,
    balance: number
    onField: PlayerField
}