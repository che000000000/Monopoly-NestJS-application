import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from "class-validator";

export class GetRoomMessagesPageDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string

    @IsNumber()
    @IsOptional()
    pageNumber: number

    @IsNumber()
    @IsOptional()
    pageSize: number
}