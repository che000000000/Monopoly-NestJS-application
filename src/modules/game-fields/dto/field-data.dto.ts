import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
import { FieldType } from "src/models/game-field.model"

export class FieldDataDto {
    @IsEnum(FieldType)
    @IsNotEmpty()
    type: FieldType

    @IsNumber()
    @IsNotEmpty()
    position: number

    @IsArray()
    @IsNumber({}, {each: true})
    @IsOptional()
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