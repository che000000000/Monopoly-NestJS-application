import { Injectable } from "@nestjs/common";
import { GameField } from "src/models/game-field.model";
import { Game } from "src/models/game.model";
import { Player } from "src/models/player.model";
import { User } from "src/models/user.model";
import { IPlayer } from "./interfaces/player";
import { IGameField } from "./interfaces/game-field";
import { IGameState } from "./interfaces/game-state";
import { IGame } from "./interfaces/game";
import { Message } from "src/models/message.model";
import { IGameChatMessage } from "./interfaces/game-chat-message";
import { IGameChatMessageSender } from "./interfaces/game-chat-message-sender";
import { IPlayerPreview } from "./interfaces/player-preview";
import { IGamePreview } from "./interfaces/game-preview";
import { GameTurn } from "src/models/game-turn.model";
import { IGameTurn } from "./interfaces/game-turn";

@Injectable()
export class GamesFormatterService {
    formatPlayer(player: Player, user: User): IPlayer {
        return {
            id: player.id,
            user:
            {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role
            },
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

    formatPlayerPreview(player: Player, user: User): IPlayerPreview {
        return {
            id: player.id,
            user: {
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role
            },
            chip: player.chip,
            status: player.status
        }
    }

    formatGameTurn(gameTurn: GameTurn, formattedPlayer: IPlayer): IGameTurn {
        return {
            id: gameTurn.id,
            player: formattedPlayer,
            stage: gameTurn.stage,
            expires: gameTurn.expires,
            updatedAt: gameTurn.updatedAt
        }
    }

    formatGamePreview(game: Game, formattedPlayerPreviews: IPlayerPreview[]): IGamePreview {
        return {
            id: game.id,
            players: formattedPlayerPreviews,
            createdAt: game.createdAt
        }
    }

    formatGame(game: Game, formattedPlayers: IPlayer[]): IGame {
        return {
            id: game.id,
            players: formattedPlayers,
            createdAt: game.createdAt
        }
    }

    formatGameState(game: Game, formattedGameFields: IGameField[], formattedPlayers: IPlayer[], formattedGameTurn: IGameTurn): IGameState {
        return {
            id: game.id,
            players: formattedPlayers,
            fields: formattedGameFields,
            turn: formattedGameTurn,
            houses: game.houses,
            hotels: game.hotels,
            createdAt: game.createdAt
        }
    }

    formatGameChatMessageSender(user: User, player: Player): IGameChatMessageSender {
        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            chip: player.chip,
            role: user.role
        }
    }

    formatGameChatMessage(message: Message, sender: IGameChatMessageSender | null): IGameChatMessage {
        return {
            id: message.id,
            text: message.text,
            sender,
            createdAt: message.createdAt
        }
    }
}