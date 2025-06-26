import { IsNotEmpty, IsUUID } from "class-validator";

export class KickUserFromPregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    kickedUserId: string
}