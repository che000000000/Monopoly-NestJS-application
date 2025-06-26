import { IsNotEmpty, IsUUID } from "class-validator";
import { PregameRoom } from "src/models/pregame-room.model";

export class EmitRemoveRoomDto {
    @IsUUID()
    @IsNotEmpty()
    roomId: string
}