import { IsNotEmpty, IsUUID } from "class-validator";

export class KickSocketFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string
}