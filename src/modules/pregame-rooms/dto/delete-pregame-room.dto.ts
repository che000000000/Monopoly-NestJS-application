import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class DeletePregameRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}