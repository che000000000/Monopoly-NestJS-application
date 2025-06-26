import { IsNotEmpty, IsUUID } from "class-validator";

export class RemoveUserFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}