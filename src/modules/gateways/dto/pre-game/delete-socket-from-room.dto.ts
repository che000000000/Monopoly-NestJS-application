import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteSocketDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}