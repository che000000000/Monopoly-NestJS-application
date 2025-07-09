import { PregameRoomMember } from "./pregame-room-member.interface";

export interface PregameRoomsWithMembers {
    id: string,
    members: PregameRoomMember[],
    createdAt: Date
}