import { IsNotEmpty, IsUUID } from "class-validator";

export class RemovePregameSocketDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}