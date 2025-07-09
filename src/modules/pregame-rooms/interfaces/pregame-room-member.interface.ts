export interface PregameRoomMember {
    id: string,
    name: string,
    avatarUrl: string | null,
    isOwner?: boolean,
    role: string
}