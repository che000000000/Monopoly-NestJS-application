import { Injectable } from "@nestjs/common";
import { Game } from "src/modules/games/model/game";
import { IGameState } from "./interfaces/game-state";
import { IGamePreview } from "./interfaces/game-preview";
import { IPlayerPreview } from "../players/interfaces/player-preview";
import { PlayersService } from "src/modules/players/players.service";
import { PlayersFormatterService } from "../players/players-formatter.service";
import { GameFieldsService } from "src/modules/game-fields/game-fields.service";
import { GameFieldsFormatterService } from "../game-fields/game-fields-formatter.service";
import { GameTurnsService } from "src/modules/game-turns/game-turns.service";
import { GameTurnsFormatterService } from "../game-turns/game-turns-formatter.service";
import { FormatGameState } from "./interfaces/format-game-state";

@Injectable()
export class GamesFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameTurnsService: GameTurnsService,
        private readonly playersFormatterService: PlayersFormatterService,
        private readonly gameFieldsFormatterService: GameFieldsFormatterService,
        private readonly gameTurnsFormatterService: GameTurnsFormatterService
    ) { }

    formatGamePreview(game: Game, formattedPlayerPreviews: IPlayerPreview[]): IGamePreview {
        return {
            id: game.id,
            players: formattedPlayerPreviews,
            createdAt: game.createdAt
        }
    }

    async formatGamePreviewAsync(game: Game): Promise<IGamePreview> {
        const players = await this.playersFormatterService.formatPlayerPreviewsAsync(
            await this.playersService.findAllByGameId(game.id)
        )

        return this.formatGamePreview(game, players)
    }

    formatGameState(payload: FormatGameState): IGameState {
        const { game, fields, players, turn } = payload

        return {
            id: game.id,
            players,
            fields,
            turn: turn, 
            houses: game.houses,
            hotels: game.hotels,
            createdAt: game.createdAt
        }
    }

    async formatGameStateAsync(game: Game): Promise<IGameState> {
        const [gameFields, players, gameTurn] = await Promise.all([
            this.gameFieldsFormatterService.formatGameFieldsAsync(
                await this.gameFieldsService.findAllByGameId(game.id)
            ),
            this.playersFormatterService.formatPlayersAsync(
                await this.playersService.findAllByGameId(game.id)
            ),
            this.gameTurnsFormatterService.formatGameTurnAsync(
                await this.gameTurnsService.getOneByGameIdOrThrow(game.id)
            )
        ])

        return this.formatGameState({
            game,
            fields: gameFields,
            players,
            turn: gameTurn
        })
    }
}