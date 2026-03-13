import { Game } from "src/modules/games/model/game";
import { IPlayer } from "../../players/interfaces/player";
import { IGameField } from "../../game-fields/interfaces/game-field";
import { IGameTurn } from "../../game-turns/interfaces/game-turn";

export interface FormatGameState {
    game: Game,
    fields: IGameField[]
    players: IPlayer[],
    turn: IGameTurn
}