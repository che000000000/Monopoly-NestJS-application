import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class GetRoomsPageDto {
    @IsNumber()
    @IsNotEmpty()
    pageNumber: number

    @IsNumber()
    @IsOptional()
    pageSize: number
}