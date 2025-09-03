import { IsNotEmpty, IsString } from "class-validator";

export class SendGlobalChatMessageDto {
    @IsString()
    @IsNotEmpty()
    messageText: string
}