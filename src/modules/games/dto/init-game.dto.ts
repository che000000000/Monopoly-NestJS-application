import { IsNotEmpty, IsUUID } from "class-validator";

export class InitGameDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string
}