import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}