import { PlayerChip } from "src/models/player.model";
import { IPregameRoomMember } from "./pregame-room-member";

export interface IPregameRoom {
    id: string,
    members: IPregameRoomMember[],
    availableChips: PlayerChip[],
    createdAt: Date
}