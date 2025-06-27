import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateFieldsDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string
}