import { User } from "src/modules/users/model/user.model"
import { FormattedUser } from "./interfaces/user"

export function formatUser (user: User): FormattedUser {
    return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role
    }
}