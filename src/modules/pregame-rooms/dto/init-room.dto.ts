import { IsNotEmpty, IsUUID } from "class-validator";

export class InitRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}