import { IsNotEmpty, IsNumber } from "class-validator";

export class SetPeregameRoomSlotDto {
    @IsNumber()
    @IsNotEmpty()
    slot: number
}