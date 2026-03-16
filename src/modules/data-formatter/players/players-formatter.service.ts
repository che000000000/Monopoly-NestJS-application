import { Player } from "src/modules/players/model/player";
import { UsersService } from "src/modules/users/users.service";
import { Injectable } from "@nestjs/common";
import { User } from "src/modules/users/model/user.model";
import { IPlayer } from "./interfaces/player";
import { IPlayerPreview } from "./interfaces/player-preview";
import { UsersFormatterService } from "../users/users-formatter.service";
import { IPlayerCard } from "../player-cards/interfaces/player-card";
import { PlayerCardsService } from "src/modules/player-cards/player-cards.service";
import { PlayerCardsFormatterService } from "../player-cards/player-cards-formatter.service";
import { PlayerCard } from "src/modules/player-cards/model/player-card.model";

@Injectable()
export class PlayersFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService,
        private readonly playerCardsService: PlayerCardsService,
        private readonly playerCardsFormatterService: PlayerCardsFormatterService
    ) { }

    private formatPlayer(player: Player, user: User, cards: PlayerCard[]): IPlayer {
        return {
            id: player.id,
            user: this.usersFormatterService.formatUser(user),
            chip: player.chip,
            isActive: player.isActive,
            turnNumber: player.turnNumber,
            balance: player.balance,
            cards: this.playerCardsFormatterService.formatPlayerCards(cards)
        }
    }

    async formatPlayerAsync(player: Player): Promise<IPlayer> {
        const [user, cards] = await Promise.all([
            this.usersService.getOneOrThrow(player.userId),
            this.playerCardsService.findAllByPlayerId(player.id)
        ])

        return this.formatPlayer(
            player,
            user,
            cards
        )
    }

    async formatPlayersAsync(players: Player[]): Promise<IPlayer[]> {
        return Promise.all(players.map(player =>
            this.formatPlayerAsync(player)
        ))
    }

    private formatPlayerPreview(player: Player, user: User): IPlayerPreview {
        return {
            id: player.id,
            user: this.usersFormatterService.formatUser(user),
            chip: player.chip,
            isActive: player.isActive
        }
    }

    async formatPlayerPreviewAsync(player: Player): Promise<IPlayerPreview> {
        return this.formatPlayerPreview(
            player,
            await this.usersService.getOneOrThrow(player.userId)
        )
    }

    async formatPlayerPreviewsAsync(players: Player[]): Promise<IPlayerPreview[]> {
        return Promise.all(
            players.map(p => this.formatPlayerPreviewAsync(p))
        )
    }
}