import { FormattedPlayer } from "./formatted-player";

export interface FormattedGameTurn {
    id: string,
    owner: FormattedPlayer,
    expires: number
}