import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class FindChatMessagesDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string

    @IsNumber()
    @IsOptional()
    pageSize: number
}