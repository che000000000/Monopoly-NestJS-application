import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { ActionCardMoveDirection, ActionCardPropertyType, ActionCardType } from "../model/action-card";

export class CreateActionCardDto {
    @IsString()
    @IsNotEmpty()
    description: string

    @IsEnum(ActionCardType)
    @IsNotEmpty()
    type: ActionCardType

    @IsNumber()
    @IsOptional()
    amount?: number

    @IsEnum(ActionCardMoveDirection)
    @IsOptional()
    moveDirection?: ActionCardMoveDirection

    @IsNumber()
    @IsOptional()
    moveSteps?: number

    @IsNumber()
    @IsOptional()
    targetPosition?: number

    @IsEnum(ActionCardPropertyType)
    @IsOptional()
    propertyType?: ActionCardPropertyType

    @IsNumber()
    @IsOptional()
    houseCost?: number

    @IsNumber()
    @IsOptional()
    hotelCost?: number

    @IsBoolean()
    @IsOptional()
    doubleRent?: boolean

    @IsBoolean()
    @IsOptional()
    paymentForCircleValue?: boolean

    @IsBoolean()
    @IsOptional()
    isActive?: boolean

    @IsUUID()
    @IsNotEmpty()
    gameId: string
}