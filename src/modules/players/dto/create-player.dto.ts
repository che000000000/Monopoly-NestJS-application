import { IsNotEmpty, IsString } from "class-validator"

export class CreatePlayerDto {
    @IsString()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsNotEmpty()
    matchId: string
}