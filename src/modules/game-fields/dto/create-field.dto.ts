import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { GameFieldColor, GameFieldType } from "src/models/game-field.model";

export class CreateFieldDto {
    @IsUUID()
    @IsNotEmpty()
    gameId: string

    @IsString()
    @IsNotEmpty()
    name: string

    @IsEnum(GameFieldType)
    @IsNotEmpty()
    type: GameFieldType

    @IsEnum(GameFieldColor)
    @IsOptional()
    color: GameFieldColor | null

    @IsNumber()
    @IsNotEmpty()
    position: number

    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    rent?: number[] | null

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