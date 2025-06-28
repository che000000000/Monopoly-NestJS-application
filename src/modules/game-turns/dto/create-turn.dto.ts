import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateTurnDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsUUID()
    @IsNotEmpty()
    playerId: string
}