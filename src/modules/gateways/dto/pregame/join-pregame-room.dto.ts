import { IsNotEmpty, IsUUID } from "class-validator";

export class JoinPregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    pregameRoomId: string
}