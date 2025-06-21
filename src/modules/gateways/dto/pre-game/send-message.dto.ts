import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    messageText: string
}