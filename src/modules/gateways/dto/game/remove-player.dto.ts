import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class RemovePlayerDto {
    @IsUUID()
    @IsNotEmpty()
    playerId: string

    @IsString()
    @IsNotEmpty()
    cause: string
}