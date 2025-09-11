import { IsEnum, IsNotEmpty } from "class-validator";
import { PlayerChip } from "src/modules/players/model/player";

export class SetPregameRoomMemberPlayerChipDto {
    @IsEnum(PlayerChip)
    @IsNotEmpty()
    playerChip: PlayerChip
}