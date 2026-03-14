import { IGameField } from "../../game-fields/interfaces/game-field";

export interface IForcedMove {
    id: string,
    fromGameField: IGameField,
    toGameField: IGameField
}