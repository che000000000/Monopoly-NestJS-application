import { PlayerChip } from "src/modules/players/model/player"
import { UserRole } from "src/modules/users/model/user.model"

export interface IGameChatMessageSender {
    id: string | null,
    name: string | null,
    avatarUrl: string | null
    chip: PlayerChip,
    role: UserRole | null
}