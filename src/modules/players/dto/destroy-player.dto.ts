import { IsNotEmpty, IsUUID } from "class-validator";

export class DestroyPlayerDto {
    @IsUUID()
    @IsNotEmpty()
    playerId: string
}