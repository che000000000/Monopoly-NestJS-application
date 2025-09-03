import { IsNumber, IsOptional } from "class-validator"

export class GlobalChatMessagesPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}