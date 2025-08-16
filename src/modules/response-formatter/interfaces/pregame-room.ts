import { IPregameRoomMember } from "./pregame-room-member";

export interface IPregameRoom {
    id: string,
    members: IPregameRoomMember[],
    createdAt: Date
}