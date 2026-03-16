import { Player } from "src/modules/players/model/player";
import { UsersService } from "src/modules/users/users.service";
import { Injectable } from "@nestjs/common";
import { User } from "src/modules/users/model/user.model";
import { IPlayer } from "./interfaces/player";
import { IPlayerPreview } from "./interfaces/player-preview";
import { UsersFormatterService } from "../users/users-formatter.service";
import { ActionCardsService } from "src/modules/action-cards/action-cards.service";
import { ActionCardsFormatterService } from "../action-cards/action-cards-formatter.service";
import { ActionCard } from "src/modules/action-cards/model/action-card";

@Injectable()
export class PlayersFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService,
        private readonly actionCardsService: ActionCardsService,
        private readonly actionCardsFormatterService: ActionCardsFormatterService
    ) { }

    private formatPlayer(player: Player, user: User, cards: ActionCard[]): IPlayer {
        return {
            id: player.id,
            user: this.usersFormatterService.formatUser(user),
            chip: player.chip,
            isActive: player.isActive,
            turnNumber: player.turnNumber,
            balance: player.balance,
            actionCards: this.actionCardsFormatterService.formatActionCards(cards)
        }
    }

    async formatPlayerAsync(player: Player): Promise<IPlayer> {
        const [user, actionCards] = await Promise.all([
            this.usersService.getOneOrThrow(player.userId),
            this.actionCardsService.findAllByPlayerId(player.id)
        ])

        return this.formatPlayer(
            player,
            user,
            actionCards
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