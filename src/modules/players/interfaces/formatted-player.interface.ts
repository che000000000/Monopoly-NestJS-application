import { FormattedUser } from "src/modules/users/interfaces/formatted-user.interface"

export interface FormattedPlayer {
    id: string,
    turnNumber: number,
    playerHaveTurn: boolean
    user: FormattedUser | null,
    balance: number
    fieldId: string
}