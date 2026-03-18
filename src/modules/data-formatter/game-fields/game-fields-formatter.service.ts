import { PlayersService } from "src/modules/players/players.service";
import { FormatGameField } from "./interfaces/format-game-field";
import { IGameField } from "./interfaces/game-field";
import { GameField } from "src/modules/game-fields/model/game-field";
import { PlayersFormatterService } from "../players/players-formatter.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GameFieldsFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly playersFormatterService: PlayersFormatterService
    ) { }

    private formatGameField(data: FormatGameField): IGameField {
        const { gameField, players, owner } = data

        return {
            id: gameField.id,
            name: gameField.name,
            type: gameField.type,
            color: gameField.color,
            position: gameField.position,
            players: players ?? [],
            owner: owner ?? null,
            rent: gameField.rent,
            basePrice: gameField.basePrice,
            housePrice: gameField.housePrice,
            buildsCount: gameField.buildsCount
        }
    }

    async formatGameFieldAsync(gameField: GameField): Promise<IGameField> {
        const [players, owner] = await Promise.all([
            this.playersFormatterService.formatPlayersAsync(
                await this.playersService.findAllByGameFieldId(gameField.id)
            ),
            gameField.ownerPlayerId
                ? this.playersFormatterService.formatPlayerAsync(
                    await this.playersService.getOneByIdOrThrow(gameField.ownerPlayerId)
                )
                : undefined
        ])

        return this.formatGameField({
            gameField,
            players,
            owner
        })
    }

    async formatGameFieldsAsync(gameFields: GameField[]): Promise<IGameField[]> {
        return Promise.all(
            gameFields.map(gameFiled => this.formatGameFieldAsync(gameFiled))
        )
    }
}