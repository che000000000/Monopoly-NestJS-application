import { UserRole } from "src/models/user.model"

export interface FormattedPregameRoomMember {
    id: string,
    name: string,
    avatarUrl: string | null
    isOwner: boolean,
    role: UserRole
}