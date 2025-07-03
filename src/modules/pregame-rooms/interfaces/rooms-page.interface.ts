import { FormattedUser } from "src/modules/users/interfaces/formatted-user.interface";

export interface RoomsPageItem {
    id: string,
    members: FormattedUser[],
    createdAt: Date
}