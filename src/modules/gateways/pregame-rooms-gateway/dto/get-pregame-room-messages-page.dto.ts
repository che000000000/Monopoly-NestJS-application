import { IsNumber, IsOptional } from "class-validator";

export class GetPregameRoomMessagesPageDto {
    @IsNumber()
    @IsOptional()
    pageNumber?: number

    @IsNumber()
    @IsOptional()
    pageSize?: number
}