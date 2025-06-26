import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class GetMessagesPageDto {
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