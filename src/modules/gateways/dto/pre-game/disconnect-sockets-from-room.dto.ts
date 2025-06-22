import { IsString, IsUUID } from "class-validator";

export class DisconnectSocketsFromRoomDto {
    @IsUUID()
    @IsString()
    chatId: string
}