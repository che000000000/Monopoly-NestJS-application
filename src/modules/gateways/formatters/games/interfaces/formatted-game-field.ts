import { FormattedPlayer } from "./formatted-player";

export interface FormattedGameField {
    id: string,
    name: string,
    owner: FormattedPlayer | null,
    rent: number[] | null,
    basePrice: number | null,
    position: number,
    buildsCount: number | null
}