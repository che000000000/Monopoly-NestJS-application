import { UserRole } from "src/models/user.model";

export interface FormattedUser {
    id: string,
    name: string,
    avatarUrl: string,
    role: UserRole
}