import { IsNotEmpty, IsUUID } from "class-validator";

export class NextTurnDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsUUID()
    @IsNotEmpty()
    playerId: string
}