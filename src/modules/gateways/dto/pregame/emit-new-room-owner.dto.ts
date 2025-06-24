import { IsNotEmpty, IsUUID } from "class-validator";

export class EmitNewOwnerDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}