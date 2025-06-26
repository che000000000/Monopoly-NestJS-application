import { IsNotEmpty, IsUUID } from "class-validator";

export class FindGameUsersDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string
}