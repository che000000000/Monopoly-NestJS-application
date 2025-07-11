import { PregameRoom } from "src/models/pregame-room.model";
import { CommonPregameRoom } from "./interfaces/common-pregame-room";
import { User } from "src/models/user.model";
import { convertPregameRoomMembers } from "./pregame-room-member";
import { PregameRoomWithMembers } from "./interfaces/pregame-room-with-members";

export function convertCommonPregameRoom(pregameRoom: PregameRoom): CommonPregameRoom {
    return {
        id: pregameRoom.id,
        createdAt: pregameRoom.createdAt
    }
}

export async function convertPregameRoomWithMembers(pregameRoom: PregameRoom, membersAsUsers: User[]): Promise<PregameRoomWithMembers> {
    const pregameRoomMembers = await convertPregameRoomMembers(membersAsUsers, pregameRoom)
    return {
        id: pregameRoom.id,
        members: pregameRoomMembers,
        createdAt: pregameRoom.createdAt
    }
}