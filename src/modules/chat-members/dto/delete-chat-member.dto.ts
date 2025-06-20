import { IsNotEmpty, IsUUID } from "class-validator";

export class DeleteChatMemberDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string    
}