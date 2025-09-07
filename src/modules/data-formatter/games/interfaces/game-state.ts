import { IGame } from "./game"
import { IGameField } from "./game-field"
import { IGameTurn } from "./game-turn"

export interface IGameState extends IGame {
    fields: IGameField[],
    turn: IGameTurn,
    houses: number
    hotels: number,
}