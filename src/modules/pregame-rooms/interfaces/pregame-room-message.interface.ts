import { PregameRoomMember } from "src/modules/pregame-rooms/interfaces/pregame-room-member.interface";

export interface PregameRoomMessage {
    id: string,
    text: string,
    sender: PregameRoomMember | null,
    createdAt: Date
}