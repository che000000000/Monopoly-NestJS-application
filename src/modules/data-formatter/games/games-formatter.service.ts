import { Injectable } from "@nestjs/common";
import { GameField, GameFieldColor } from "src/models/game-field.model";
import { Game } from "src/models/game.model";
import { Player } from "src/models/player.model";
import { User } from "src/models/user.model";
import { IPlayer } from "./interfaces/player";
import { IGameField } from "./interfaces/game-field";
import { IGameState } from "./interfaces/game-state";
import { IGame } from "./interfaces/game";

@Injectable()
export class GamesFormatterService {
    formatPlayer(player: Player, user: User | null): IPlayer {
        return {
            id: player.id,
            user: user
                ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role
                }
                : null,
            chip: player.chip,
            status: player.status,
            turnNumber: player.turnNumber,
            balance: player.balance
        }
    }

    formatGameField(gameField: GameField, onFieldFormattedPlayers: IPlayer[] | null, ownerFormattedPlayer: IPlayer | null): IGameField {
        return {
            id: gameField.id,
            name: gameField.name,
            type: gameField.type,
            color: gameField.color,
            position: gameField.position,
            rent: gameField.rent,
            basePrice: gameField.basePrice,
            housePrice: gameField.housePrice,
            buildsCount: gameField.buildsCount,
            players: onFieldFormattedPlayers,
            owner: ownerFormattedPlayer,
        }
    }

    formatGame(game: Game, formattedPlayers: IPlayer[]): IGame {
        return {
            id: game.id,
            players: formattedPlayers,
            createdAt: game.createdAt
        }
    }

    formatGameState(game: Game, formattedGameFields: IGameField[], formattedPlayers: IPlayer[]): IGameState {
        return {
            id: game.id,
            players: formattedPlayers,
            fields: formattedGameFields,
            houses: game.houses,
            hotels: game.hotels,
            createdAt: game.createdAt
        }
    }
}