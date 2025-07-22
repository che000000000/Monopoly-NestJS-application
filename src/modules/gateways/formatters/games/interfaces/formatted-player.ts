import { UserRole } from "src/models/user.model";

export interface FormattedPlayer {
    id: string,
    name: string,
    avatarUrl: string | null,
    role: UserRole,
    balance: number
}