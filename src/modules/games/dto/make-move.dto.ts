import { IsNotEmpty, IsUUID } from "class-validator";

export class MakeMoveDto {
    @IsUUID()
    @IsNotEmpty()
    playerId: string

    @IsUUID()
    @IsNotEmpty()
    gameId: string
}