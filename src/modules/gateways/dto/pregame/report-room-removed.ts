import { IsNotEmpty, IsUUID } from "class-validator";

export class ReportRoomRemovedDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}