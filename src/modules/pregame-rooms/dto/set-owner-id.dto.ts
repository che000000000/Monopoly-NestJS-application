import { IsNotEmpty, IsUUID } from "class-validator";

export class SetOwnerIdDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    roomId: string
}