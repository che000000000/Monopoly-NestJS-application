import { PregameRoom } from "src/models/pregame-room.model";
import { User } from "src/models/user.model";
import { FormattedPregameRoomMember } from "./interfaces/formatted-pregame-room-member";

export function formatPregameRoomMember(user: User, pregameRoom: PregameRoom): FormattedPregameRoomMember {
    return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isOwner: user.id === pregameRoom.ownerId ? true : false,
        role: user.role
    }
}

export async function formatPregameRoomMembers(users: User[], pregameRoom: PregameRoom): Promise<FormattedPregameRoomMember[]> {
    return await Promise.all(
        users.map(user => (
            formatPregameRoomMember(user, pregameRoom)
        ))
    )
}