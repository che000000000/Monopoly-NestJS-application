import { IsNotEmpty, IsUUID } from "class-validator";

export class FindChatMembersDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string
}