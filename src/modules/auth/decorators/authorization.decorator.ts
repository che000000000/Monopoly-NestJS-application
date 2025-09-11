import { applyDecorators, UseGuards } from "@nestjs/common"
import { UserRole } from "src/modules/users/model/user.model"
import { Roles } from "./roles.decorator"
import { AuthGuard } from "../guards/auth.guard"
import { RolesGuard } from "../guards/roles.guard"

export function Authorization(requiredRole: UserRole) {
    return applyDecorators(
        Roles(requiredRole),
        UseGuards(AuthGuard, RolesGuard)
    )
}