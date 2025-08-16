import { IUser } from "./user"

export interface IPregameRoomMember {
    id: string,
    slot: number,
    isOwner: boolean,
    user: IUser
    createdAt: Date
}