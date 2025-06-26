import { IsNotEmpty, IsUUID } from "class-validator";

export class AppointNewOwnerDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}