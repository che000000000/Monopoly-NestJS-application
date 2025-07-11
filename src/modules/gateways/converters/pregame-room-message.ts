import { User } from "src/models/user.model";
import { PregameRoomMessage } from "./interfaces/pregame-room-message";
import { PregameRoom } from "src/models/pregame-room.model";
import { Message } from "src/models/message.model";
import { convertPregameRoomMember } from "./pregame-room-member";
import { convertCommonPregameRoom } from "./pregame-room";

export function convertPregameRoomMessage(user: User, pregameRoom: PregameRoom, message: Message): PregameRoomMessage {
    return {
        id: message.id,
        messageText: message.text,
        pregameRoom: convertCommonPregameRoom(pregameRoom),
        sender: convertPregameRoomMember(user, pregameRoom),
        createdAt: message.createdAt
    }
}