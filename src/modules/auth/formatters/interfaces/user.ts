import { UserRole } from "src/modules/users/model/user.model";

export interface FormattedUser {
    id: string,
    name: string,
    avatarUrl: string,
    role: UserRole
}