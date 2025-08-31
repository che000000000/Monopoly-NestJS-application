import { IsNotEmpty, IsString } from "class-validator";

export class SendPregameRoomMessageDto {
    @IsString()
    @IsNotEmpty()
    messageText: string
}