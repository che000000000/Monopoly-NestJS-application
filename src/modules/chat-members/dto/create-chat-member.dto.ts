import { IsNotEmpty, IsUUID } from "class-validator";

export class CreateChatMemberDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string
}