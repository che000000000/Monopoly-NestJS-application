import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class LeaveFromGameDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsString()
    gameId: string
}