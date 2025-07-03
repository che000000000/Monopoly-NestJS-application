import { IsNotEmpty, IsUUID } from "class-validator";

export class KickUserFromPregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}