import { FormatedUser } from "./formated-user.interface";

export interface RoomsPageItem {
    id: string,
    members: FormatedUser[],
    createdAt: Date
}