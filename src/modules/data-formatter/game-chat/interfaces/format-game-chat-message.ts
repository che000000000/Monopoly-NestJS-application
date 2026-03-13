import { Message } from "src/modules/messages/model/message";
import { IGameChatMessageSender } from "./game-chat-message-sender";

export interface FormatGameChatMessage {
    message: Message,
    sender?: IGameChatMessageSender
}