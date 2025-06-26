import { IsArray, isNotEmpty, IsNotEmpty, IsUUID } from "class-validator";

export class CreatePlayerDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty({ each: true })
    usersIds: string[]
}