import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinRoomDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}