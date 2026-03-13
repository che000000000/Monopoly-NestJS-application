import { GameField } from "src/modules/game-fields/model/game-field";
import { IPlayer } from "../../players/interfaces/player";

export interface FormatGameField {
    gameField: GameField,
    players?: IPlayer[]
    owner?: IPlayer,
}