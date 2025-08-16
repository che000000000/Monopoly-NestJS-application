import { AuthMethod } from "src/models/user.model"

export interface IUser {
    id: string,
    name: string,
    avatarUrl: string,
    role: string
}