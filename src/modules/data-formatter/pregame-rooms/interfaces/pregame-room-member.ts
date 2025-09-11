import { PlayerChip } from "src/modules/players/model/player"
import { IUser } from "../../interfaces/user"

export interface IPregameRoomMember {
    id: string,
    slot: number,
    playerChip: PlayerChip,
    isOwner: boolean,
    user: IUser | null,
    createdAt: Date
}