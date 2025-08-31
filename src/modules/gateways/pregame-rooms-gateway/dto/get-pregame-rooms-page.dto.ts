import { IsNumber, IsOptional } from "class-validator";

export class GetPregameRoomsPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}