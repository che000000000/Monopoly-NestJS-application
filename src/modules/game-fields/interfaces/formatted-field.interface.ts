import { FieldType } from "src/models/game-field.model";
import { FormattedPlayer } from "src/modules/players/interfaces/formatted-player.interface";

export interface FormattedField {
    id: string,
    name: string,
    type: FieldType,
    position: number,
    basePrice: number | null
    rent: number[] | null,
    housePrice: number | null,
    buildsCount: number | null,
    owner: FormattedPlayer
}