import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinPregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}