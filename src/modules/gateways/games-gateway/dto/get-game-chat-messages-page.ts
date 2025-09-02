import { IsNumber, IsOptional } from "class-validator";

export class GetGameChatMessagesPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}