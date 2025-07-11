import { IsOptional, IsUUID } from "class-validator";

export class GetMessagesPageDto {
    @IsUUID()
    @IsOptional()
    pageNumber?: number

    @IsUUID()
    @IsOptional()
    pageSize?: number
}