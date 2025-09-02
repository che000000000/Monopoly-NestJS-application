import { PlayerChip } from "src/models/player.model"
import { UserRole } from "src/models/user.model"

export interface IGameChatMessageSender {
    id: string,
    name: string,
    avatarUrl: string
    chip: PlayerChip,
    role: UserRole
}