import { IsNotEmpty, IsUUID } from "class-validator"

export class FindChatMemberDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string
}