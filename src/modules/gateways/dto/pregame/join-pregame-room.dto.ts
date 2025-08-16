import { IsNotEmpty, IsNumber, IsUUID } from "class-validator";

export class JoinPregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    pregameRoomId: string

    @IsNumber()
    @IsNotEmpty()
    slotNumber: number
}