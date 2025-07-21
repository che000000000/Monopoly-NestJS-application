import { IsNumber, IsOptional } from "class-validator";

export class GetRoomsPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}