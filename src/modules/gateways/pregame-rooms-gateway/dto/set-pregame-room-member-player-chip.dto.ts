import { IsEnum, IsNotEmpty } from "class-validator";
import { PlayerChip } from "src/models/player.model";

export class SetPregameRoomMemberPlayerChipDto {
    @IsEnum(PlayerChip)
    @IsNotEmpty()
    playerChip: PlayerChip
}