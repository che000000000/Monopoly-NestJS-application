import { IsNotEmpty, IsUUID } from "class-validator";

export class RemoveFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}