import { IsNotEmpty, IsUUID } from "class-validator";

export class KickFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}