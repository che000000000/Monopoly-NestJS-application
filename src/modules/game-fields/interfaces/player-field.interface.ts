import { FieldType } from "src/models/game-field.model";

export interface PlayerField {
    id: string,
    name: string,
    type: FieldType,
    positon: number
}