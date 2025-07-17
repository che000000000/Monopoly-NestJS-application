import { FormattedPlayer } from "./formatted-player";

export interface FormattedGameWithPlayers {
    id: string,
    players: FormattedPlayer[]
    createdAt: Date
}