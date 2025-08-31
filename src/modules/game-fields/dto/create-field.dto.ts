import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { GameFieldType } from "src/models/game-field.model";

export class CreateFieldDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsEnum(GameFieldType)
    @IsNotEmpty()
    type: GameFieldType

    @IsNumber()
    @IsNotEmpty()
    position: number

    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    rent?: number[] | null

    @IsString()
    @IsNotEmpty()
    name: string

    @IsNumber()
    @IsOptional()
    basePrice?: number | null

    @IsNumber()
    @IsOptional()
    housePrice?: number | null

    @IsNumber()
    @IsOptional()
    buildsCount?: number | null
}