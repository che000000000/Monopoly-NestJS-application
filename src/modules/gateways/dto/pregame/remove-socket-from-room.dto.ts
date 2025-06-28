import { IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class RemoveSocketFromRoomDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}