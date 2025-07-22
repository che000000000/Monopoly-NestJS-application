import { GameField } from "src/models/game-field.model";
import { User } from "src/models/user.model";
import { FormattedGameField } from "./interfaces/formatted-game-field";
import { Player } from "src/models/player.model";

export function formatGameField(gameField: GameField, ownerPlayer: Player | null, ownerUser: User | null): FormattedGameField {
    return {
        id: gameField.id,
        name: gameField.name,
        owner: ownerPlayer && ownerUser ? {
            id: ownerPlayer.id,
            name: ownerUser.name,
            avatarUrl: ownerUser.avatarUrl,
            role: ownerUser.role,
            balance: ownerPlayer.balance
        } : null,
        rent: gameField.rent,
        basePrice: gameField.basePrice,
        position: gameField.position,
        buildsCount: gameField.buildsCount
    }
}