import { IUser } from "../../interfaces/user"

export interface IPregameRoomMessage {
    id: string,
    message: string
    sender: IUser | null,
    createdAt: Date
}