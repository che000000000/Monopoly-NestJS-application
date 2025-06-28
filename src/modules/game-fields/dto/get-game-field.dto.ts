import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class GetGameField {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsNumber()
    @IsNotEmpty()
    position: number
}