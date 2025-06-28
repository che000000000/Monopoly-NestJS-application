import { FieldType } from "src/models/game-field.model";

export interface FieldData {
    type: FieldType,
    position: number,
    name: string,
    basePrice: number | null,
    housePrice: number | null,
    buildsCount: number | null,
    rent: number[] | null
    ownerPlayerId: string | null
}