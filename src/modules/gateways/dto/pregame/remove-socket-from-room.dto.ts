import { IsNotEmpty, IsUUID } from "class-validator";

export class RemoveSocketFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    roomId: string
}