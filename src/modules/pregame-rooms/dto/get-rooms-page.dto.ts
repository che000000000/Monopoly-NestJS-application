import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class GetRoomsPageDto {
    @IsNumber()
    @IsOptional()
    pageSize: number

    @IsNumber()
    @IsNotEmpty()
    pageNumber: number
}