import { IsNotEmpty, IsUUID } from "class-validator";

export class LeaveFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}