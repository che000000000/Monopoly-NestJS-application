import { IsNotEmpty, IsUUID } from "class-validator";

export class UpdateGameIdDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    gameId: string
}