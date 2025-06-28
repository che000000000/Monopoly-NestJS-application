import { IsNotEmpty, IsUUID } from "class-validator";
import { FieldData } from "../interfaces/field-data.interface";

export class CreateFieldDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    fieldData: FieldData
}