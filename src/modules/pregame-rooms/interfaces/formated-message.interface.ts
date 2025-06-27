import { FormatedUser } from "./formated-user.interface";

export interface FormatedMessage {
    id: string,
    text: string,
    sender: FormatedUser,
    createdAt: Date
}