import { IGameField } from "../../game-fields/interfaces/game-field"
import { IGameTurn } from "../../game-turns/interfaces/game-turn"
import { IPlayer } from "../../players/interfaces/player"

export interface IGameState {
    id: string,
    fields: IGameField[],
    players: IPlayer[],
    turn: IGameTurn,
    houses: number
    hotels: number,
    createdAt: Date
}