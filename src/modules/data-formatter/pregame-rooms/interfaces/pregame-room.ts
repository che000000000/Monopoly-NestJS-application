import { PlayerChip } from "src/modules/players/model/player";
import { IPregameRoomMember } from "./pregame-room-member";

export interface IPregameRoom {
    id: string,
    members: IPregameRoomMember[],
    availableChips: PlayerChip[],
    createdAt: Date
}

export interface ICompressedPregameRoom {
    id: string,
    createdAt: string
}