import { SetMetadata } from "@nestjs/common"
import { UserRole } from "src/models/user.model"

export const ROLES_KEY = 'roles'
export const Roles = (...roles: UserRole[]) => {
    return SetMetadata(ROLES_KEY, roles)
}