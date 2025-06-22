import { IsNotEmpty, IsUUID } from "class-validator";

export class FindPregameRoomUsersDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}