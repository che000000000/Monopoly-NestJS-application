import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class UpdatePregameRoomIdDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsOptional()
    roomId: string | null
}