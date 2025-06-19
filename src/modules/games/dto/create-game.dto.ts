import { IsArray, IsString } from "class-validator";

export class CreateGameDto {
    @IsArray()
    @IsString({ each: true })
    usersIds: []
}