import { Player } from "src/modules/players/model/player";
import { UsersService } from "src/modules/users/users.service";
import { Injectable } from "@nestjs/common";
import { User } from "src/modules/users/model/user.model";
import { IPlayer } from "./interfaces/player";
import { IPlayerPreview } from "./interfaces/player-preview";
import { UsersFormatterService } from "../users/users-formatter.service";

@Injectable()
export class PlayersFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService
    ) { }

    private formatPlayer(player: Player, user: User): IPlayer {
        return {
            id: player.id,
            user: this.usersFormatterService.formatUser(user),
            chip: player.chip,
            status: player.status,
            turnNumber: player.turnNumber,
            balance: player.balance
        }
    }

    async formatPlayerAsync(player: Player): Promise<IPlayer> {
        return this.formatPlayer(
            player,
            await this.usersService.getOneOrThrow(player.userId)
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
            status: player.status
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