import { GameFieldType } from "src/modules/game-fields/model/game-field"
import { IPlayer } from "../../players/interfaces/player"
import { MonopolyColor } from "src/modules/monopolies/model/monopoly"

export interface IGameField {
    id: string,
    name: string,
    type: GameFieldType,
    color: MonopolyColor | null,
    position: number,
    players: IPlayer[],
    owner: IPlayer | null
    rent: number[] | null,
    basePrice: number | null,
    housePrice: number | null,
    buildsCount: number | null,
}