import { UserRole } from "src/modules/users/model/user.model";

export interface IUser {
    id: string,
    name: string,
    avatarUrl: string,
    role: UserRole
}