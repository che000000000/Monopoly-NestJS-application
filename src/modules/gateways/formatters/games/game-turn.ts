import { GameTurn } from "src/models/game-turn.model";
import { FormattedPlayer } from "./interfaces/formatted-player";
import { FormattedGameTurn } from "./interfaces/formatted-game-turn";

export function formatGameTurn(gameTurn: GameTurn, player: FormattedPlayer): FormattedGameTurn {
    return {
        id: gameTurn.id,
        owner: player,
        expires: gameTurn.expires
    }
}