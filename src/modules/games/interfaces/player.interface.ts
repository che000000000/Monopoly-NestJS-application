export interface Player {
    id: string,
    balance: number,
    user: {
        id: string,
        name: string,
        avatarUrl: string,
        role: string
    }
    gameField: {
        id: string,
        name: string
    }
}