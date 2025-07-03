export interface FormattedUser {
    id: string,
    name: string,
    avatarUrl: string | null,
    isOwner?: boolean,
    role: string
}