import { PregameRoom } from "src/models/pregame-room.model";
import { CommonPregameRoom } from "./interfaces/common-pregame-room";

export function convertCommonPregameRoom(pregameRoom: PregameRoom): CommonPregameRoom {
    return {
        id: pregameRoom.id,
        createdAt: pregameRoom.createdAt
    }
}