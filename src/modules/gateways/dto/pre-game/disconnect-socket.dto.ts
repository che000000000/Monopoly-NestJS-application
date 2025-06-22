import { IsNotEmpty, IsUUID } from "class-validator";

export class DisconnectSocketDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string
}