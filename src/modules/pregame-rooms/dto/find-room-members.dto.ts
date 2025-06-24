import { IsNotEmpty, IsUUID } from "class-validator";

export class FindRoomMembersDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}