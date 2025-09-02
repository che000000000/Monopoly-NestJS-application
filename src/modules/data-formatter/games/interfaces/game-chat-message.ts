import { IGameChatMessageSender } from "./game-chat-message-sender"

export interface IGameChatMessage {
    id: string,
    text: string
    sender: IGameChatMessageSender | null,
    createdAt: Date
}