import { IsOptional, IsUUID } from "class-validator";

export class GetGameStateDto {
    @IsUUID()
    @IsOptional()
    gameId?: string
}