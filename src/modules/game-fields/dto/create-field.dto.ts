import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { GameFieldType } from "../model/game-field";
import { MonopolyColor } from "src/modules/monopolies/model/monopoly";

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

    @IsEnum(MonopolyColor)
    @IsOptional()
    color?: MonopolyColor

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