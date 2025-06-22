import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateGameDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string

    @IsUUID()
    @IsNotEmpty()
    userId: string
}