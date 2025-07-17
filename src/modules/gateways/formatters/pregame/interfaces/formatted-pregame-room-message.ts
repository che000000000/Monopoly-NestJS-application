import { FormattedPregameRoomMember } from "./formatted-pregame-room-member";

export interface FormattedPregameRoomMessage {
    id: string, 
    messageText: string,
    sender: FormattedPregameRoomMember | null,
    createdAt: Date
}