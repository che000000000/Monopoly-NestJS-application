import { GameFieldColor, GameFieldType } from "src/modules/game-fields/model/game-field";
import { IPlayer } from "./player";

export interface IGameField {
    id: string,
    name: string,
    type: GameFieldType,
    color: GameFieldColor | null,
    position: number,
    players: IPlayer[] | null,
    owner: IPlayer | null
    rent: number[] | null,
    basePrice: number | null,
    housePrice: number | null,
    buildsCount: number | null
}