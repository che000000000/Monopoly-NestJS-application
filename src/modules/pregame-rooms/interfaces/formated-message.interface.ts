import { FormattedUser } from "src/modules/users/interfaces/formatted-user.interface";

export interface FormatedMessage {
    id: string,
    text: string,
    sender: FormattedUser | null,
    createdAt: Date
}