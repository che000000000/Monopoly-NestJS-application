import { FormatedRoom } from "./formated-room.interface";
import { FormatedUser } from "./formated-user.interface";

export interface RoomsPageItem {
    pregameRoom: FormatedRoom,
    roomMembers: FormatedUser[],
}