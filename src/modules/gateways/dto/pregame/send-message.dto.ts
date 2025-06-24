import { IsNotEmpty, IsUUID } from "class-validator";

export class SendMessageDto {
    @IsUUID()
    @IsNotEmpty()
    messageText: string
}