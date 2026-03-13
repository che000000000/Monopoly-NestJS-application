import { Injectable } from "@nestjs/common";
import { User } from "src/modules/users/model/user.model";
import { IUser } from "./interfaces/user";

@Injectable()
export class UsersFormatterService {
    formatUser(user: User): IUser {
        return {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: user.role
        }
    }
}