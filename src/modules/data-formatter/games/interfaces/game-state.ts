import { IGame } from "./game"
import { IGameField } from "./game-field"

export interface IGameState extends IGame {
    fields: IGameField[]
    houses: number
    hotels: number,
}