import { PregameRoomMessage } from "./pregame-room-message.interface";

export interface PregameRoomWithMessages {
    id: string,
    messages: PregameRoomMessage[],
    createdAt: string
}