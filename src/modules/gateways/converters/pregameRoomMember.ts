import { PregameRoom } from "src/models/pregame-room.model";
import { User } from "src/models/user.model";
import { PregameRoomMember } from "./interfaces/pregame-room-member";

export function convertPregameRoomMember(user: User, pregameRoom: PregameRoom): PregameRoomMember {
    return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isOwner: user.id === pregameRoom.ownerId ? true : false,
        role: user.role
    }
}

export async function convertPregameRoomMembers(users: User[], pregameRoom: PregameRoom): Promise<PregameRoomMember[]> {
    return await Promise.all(
        users.map(user => (
            convertPregameRoomMember(user, pregameRoom)
        ))
    )
}