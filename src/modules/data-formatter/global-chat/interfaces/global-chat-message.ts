import { IUser } from "../../users/interfaces/user"

export interface IGlobalChatMessage {
    id: string,
    text: string
    sender: IUser | null,
    createdAt: Date
}