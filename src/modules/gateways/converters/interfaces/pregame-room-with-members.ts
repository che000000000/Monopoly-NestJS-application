import { PregameRoomMember } from "./pregame-room-member";

export interface PregameRoomWithMembers {
    id: string,
    members: PregameRoomMember[],
    createdAt: Date
}