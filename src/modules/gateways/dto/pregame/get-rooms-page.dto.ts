import { IsOptional, IsUUID } from "class-validator";

export class GetRoomsPageDto {
    @IsUUID()
    @IsOptional()
    pageNumber?: number

    @IsUUID()
    @IsOptional()
    pageSize?: number
}