import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class RemovePlayer {
    @IsUUID()
    @IsNotEmpty()
    playerId: string

    @IsString()
    @IsNotEmpty()
    cause: string
}