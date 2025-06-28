import { IsNotEmpty, IsUUID } from "class-validator";

export class RemovePlayerSocket {
    @IsUUID()
    @IsNotEmpty()
    playerId: string
}