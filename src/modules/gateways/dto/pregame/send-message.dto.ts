import { IsNotEmpty, IsString } from "class-validator";

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    messageText: string
}