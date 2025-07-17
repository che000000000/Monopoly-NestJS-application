import { PregameRoom } from "src/models/pregame-room.model";
import { User } from "src/models/user.model";
import { FormattedCommonPregameRoom } from "./interfaces/formatted-common-pregame-room";
import { FormattedPregameRoomWithMembers } from "./interfaces/foramtted-pregame-room-with-members";
import { formatPregameRoomMembers } from "./pregame-room-member";

export function formatCommonPregameRoom(pregameRoom: PregameRoom): FormattedCommonPregameRoom {
    return {
        id: pregameRoom.id,
        createdAt: pregameRoom.createdAt
    }
}

export async function formatPregameRoomWithMembers(pregameRoom: PregameRoom, membersAsUsers: User[]): Promise<FormattedPregameRoomWithMembers> {
    const pregameRoomMembers = await formatPregameRoomMembers(membersAsUsers, pregameRoom)
    return {
        id: pregameRoom.id,
        members: pregameRoomMembers,
        createdAt: pregameRoom.createdAt
    }
}