import { IsNotEmpty, IsUUID } from "class-validator";
import { Dices } from "src/modules/games/interfaces/dices.interface";

export class UpdateFieldIdDto {
    @IsUUID()
    @IsNotEmpty()
    playerId: string

    dices: Dices
}