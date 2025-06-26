import { IsNotEmpty, IsUUID } from "class-validator";

export class KickUserFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    kickedUserId: string
}