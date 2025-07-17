import { Game } from "src/models/game.model";
import { FormattedCommonGame } from "./interfaces/formatted-common-game";
import { FormattedGameWithPlayers } from "./interfaces/formatted-game-with-players";
import { FormattedPlayer } from "./interfaces/formatted-player";

export function formatCommonGame(game: Game): FormattedCommonGame {
    return {
        id: game.id,
        createdAt: game.createdAt
    }
}

export function formatGameWithPlayers(game: Game, players: FormattedPlayer[]): FormattedGameWithPlayers {
    return {
        id: game.id,
        players,
        createdAt: game.createdAt
    }
}