import { Player } from "src/models/player.model";
import { FormattedPlayer } from "./interfaces/formatted-player";
import { User } from "src/models/user.model";

export function formatPlayer(player: Player, user: User): FormattedPlayer {
    return {
        id: player.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        balance: player.balance
    }
}