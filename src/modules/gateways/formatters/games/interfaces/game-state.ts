import { FormattedGameField } from "./formatted-game-field";
import { FormattedGameTurn } from "./formatted-game-turn";
import { FormattedPlayer } from "./formatted-player";

export interface GameState {
    id: string,
    players: FormattedPlayer[],
    fields: FormattedGameField[],
    turn: FormattedGameTurn
    createdAt: Date
}