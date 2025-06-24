import { IsNumber, IsOptional } from "class-validator"

export class GetMessagesPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber: number

    @IsNumber()
    @IsOptional()
    pageSize: number
}