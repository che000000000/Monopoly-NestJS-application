import { IsNotEmpty, IsUUID } from "class-validator";

export class LeaveRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    roomId: string
}