import { IsNotEmpty, IsUUID } from "class-validator";

export class MoveDto {
    @IsUUID()
    @IsNotEmpty()
    playerId: string

    @IsUUID()
    @IsNotEmpty()
    gameId: string
}