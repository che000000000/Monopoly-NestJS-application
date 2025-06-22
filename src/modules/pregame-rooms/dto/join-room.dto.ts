import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinRoomDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string

    @IsUUID()
    @IsNotEmpty()
    userId: string
}