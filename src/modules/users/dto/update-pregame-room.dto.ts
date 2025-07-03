import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class UpdatePregameRoomIdDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    newRoomId: string | null
}