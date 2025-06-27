import { IsNotEmpty, IsUUID } from "class-validator";

export class GetChatMessagesCountDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string
}