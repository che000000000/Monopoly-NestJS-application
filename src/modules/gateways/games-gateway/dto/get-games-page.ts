import { IsNumber, IsOptional } from "class-validator";

export class GetGamesPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}