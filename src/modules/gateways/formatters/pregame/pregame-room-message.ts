import { User } from "src/models/user.model";
import { PregameRoom } from "src/models/pregame-room.model";
import { Message } from "src/models/message.model";
import { FormattedPregameRoomMessage } from "./interfaces/formatted-pregame-room-message";
import { formatPregameRoomMember } from "./pregame-room-member";

export function formatPregameRoomMessage(user: User | null, pregameRoom: PregameRoom, message: Message): FormattedPregameRoomMessage {
    return {
        id: message.id,
        messageText: message.text,
        sender: user ? formatPregameRoomMember(user, pregameRoom) : null,
        createdAt: message.createdAt
    }
}  