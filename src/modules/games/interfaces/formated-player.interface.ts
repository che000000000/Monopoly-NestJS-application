import { FormatedUser } from "./formated-user.interface";

export interface FormatedPlayer {
    id: string,
    turnNumber: number,
    user: FormatedUser | null,
    fieldId: string
}