import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendGameChatMessageDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsString()
    @IsNotEmpty()
    messageText: string
}