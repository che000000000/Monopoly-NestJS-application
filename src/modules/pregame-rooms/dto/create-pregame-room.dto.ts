import { IsNotEmpty, IsUUID } from "class-validator";

export class CreatePregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}