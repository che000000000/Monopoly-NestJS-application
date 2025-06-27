import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class CreatePlayerDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsUUID()
    @IsNotEmpty()
    fieldId: string

    @IsNumber()
    @IsNotEmpty()
    turnNumber: number
}