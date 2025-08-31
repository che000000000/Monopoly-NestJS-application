import { PlayerChip } from "src/models/player.model"
import { IUser } from "../../interfaces/user"

export interface IPregameRoomMember {
    id: string,
    slot: number,
    playerChip: PlayerChip,
    isOwner: boolean,
    user: IUser | null,
    createdAt: Date
}