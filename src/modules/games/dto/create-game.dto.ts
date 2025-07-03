import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateGameDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string
}