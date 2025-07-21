import { FormattedPregameRoomMember } from "./formatted-pregame-room-member";

export interface FormattedPregameRoomWithMembers {
    id: string,
    members: FormattedPregameRoomMember[],
    createdAt: Date
}