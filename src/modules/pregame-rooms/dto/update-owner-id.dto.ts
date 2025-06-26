import { IsNotEmpty, IsUUID } from "class-validator";

export class UpdateOwnerIdDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string

    @IsUUID()
    @IsNotEmpty()
    newOwnerId: string
}