import { IsNotEmpty, IsUUID } from "class-validator";

export class RemoveRoomDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}