import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsString()
    @IsNotEmpty()
    messageText: string
}