import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class GetChatMessagesDto {
    @IsUUID()
    @IsNotEmpty()
    chatId: string

    @IsNumber()
    @IsOptional()
    pageSize: number

    @IsNumber()
    @IsOptional()
    pageNumber: number
}