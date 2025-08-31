import { IsNotEmpty, IsNumber } from "class-validator";

export class SetPeregameRoomMemberSlotDto {
    @IsNumber()
    @IsNotEmpty()
    slot: number
}