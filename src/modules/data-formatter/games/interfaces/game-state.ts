import { IGameField } from "../../game-fields/interfaces/game-field"
import { IGameTurn } from "../../game-turns/interfaces/game-turn"
import { IGame } from "./game"

export interface IGameState extends IGame {
    fields: IGameField[],
    turn: IGameTurn,
    houses: number
    hotels: number,
}