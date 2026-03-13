import { IUser } from "../../users/interfaces/user"

export interface IPregameRoomChatMessage {
    id: string,
    text: string
    sender: IUser | null,
    createdAt: Date
}