import { IsString, IsUUID } from "class-validator";

export class DeleteRoomSocketsDto {
    @IsUUID()
    @IsString()
    roomId: string

    @IsUUID()
    @IsString()
    chatId: string
}