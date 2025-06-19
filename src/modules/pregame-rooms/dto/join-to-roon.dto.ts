import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinToRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    roomId: string
}