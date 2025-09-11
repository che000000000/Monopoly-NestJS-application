import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { GameFieldColor, GameFieldType } from "../model/game-field";

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
    color?: GameFieldColor

    @IsNumber()
    @IsNotEmpty()
    position: number

    @IsArray()
    @IsOptional()
    @IsNumber({}, { each: true })
    rent?: number[]

    @IsNumber()
    @IsOptional()
    basePrice?: number

    @IsNumber()
    @IsOptional()
    housePrice?: number

    @IsNumber()
    @IsOptional()
    buildsCount?: number
}