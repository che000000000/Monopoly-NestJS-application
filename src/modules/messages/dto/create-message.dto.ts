import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateMessageDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string

    @IsString()
    @IsNotEmpty()
    messageText: string
}