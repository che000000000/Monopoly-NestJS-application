import { CommonPregameRoom } from "./common-pregame-room";
import { PregameRoomMember } from "./pregame-room-member";

export interface PregameRoomMessage {
    id: string, 
    messageText: string,
    pregameRoom: CommonPregameRoom
    sender: PregameRoomMember,
    createdAt: Date
}