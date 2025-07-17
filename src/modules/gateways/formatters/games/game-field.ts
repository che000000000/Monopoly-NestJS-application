import { GameField } from "src/models/game-field.model";
import { User } from "src/models/user.model";
import { FormattedGameField } from "./interfaces/formatted-game-field";

export async function formatGameField(gameField: GameField, owner: User | null): Promise<FormattedGameField> {
    return {
        id: gameField.id,
        name: gameField.name,
        owner: owner ? {
            id: owner.id,
            name: owner.name,
            avatarUrl: owner.avatarUrl,
            role: owner.role
        } : null,
        rent: gameField.rent,
        basePrice: gameField.basePrice,
        position: gameField.position,
        buildsCount: gameField.buildsCount
    }
}