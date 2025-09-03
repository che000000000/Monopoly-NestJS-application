import { IUser } from "../../interfaces/user"

export interface IGlobalChatMessage {
    id: string,
    text: string
    sender: IUser | null,
    createdAt: Date
}