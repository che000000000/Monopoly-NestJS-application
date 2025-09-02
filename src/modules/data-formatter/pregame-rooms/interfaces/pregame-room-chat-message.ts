import { IUser } from "../../interfaces/user"

export interface IPregameRoomChatMessage {
    id: string,
    text: string
    sender: IUser | null,
    createdAt: Date
}