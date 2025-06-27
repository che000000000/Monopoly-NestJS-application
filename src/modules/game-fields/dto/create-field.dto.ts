import { IsNotEmpty, IsUUID } from "class-validator";
import { FieldDataDto } from "./field-data.dto";

export class CreateFieldDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    fieldData: FieldDataDto
}