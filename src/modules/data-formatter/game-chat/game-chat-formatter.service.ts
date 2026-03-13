import { PlayersService } from "src/modules/players/players.service";
import { FormatGameChatMessageSender } from "./interfaces/format-game-chat-message-sender";
import { UsersService } from "src/modules/users/users.service";
import { Message } from "src/modules/messages/model/message";
import { MessagesService } from "src/modules/messages/messages.service";
import { IGameChatMessage } from "./interfaces/game-chat-message";
import { FormatGameChatMessage } from "./interfaces/format-game-chat-message";
import { IGameChatMessageSender } from "./interfaces/game-chat-message-sender";
import { ChatsService } from "src/modules/chats/chats.service";
import { ChatType } from "src/modules/chats/model/chat";
import { GamesService } from "src/modules/games/games.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GameChatFormatterService {
    constructor(
        private readonly playersService: PlayersService,
        private readonly usersService: UsersService,
        private readonly chatsService: ChatsService,
        private readonly messagesService: MessagesService,
        private readonly gamesService: GamesService
    ) { }

    private formatGameChatMessageSender(data: FormatGameChatMessageSender): IGameChatMessageSender {
        const { user, player } = data

        return {
            id: user?.id ?? null,
            name: user?.name ?? null,
            avatarUrl: user?.avatarUrl ?? null,
            chip: player.chip,
            role: user?.role ?? null
        }
    }

    private formatGameChatMessage(data: FormatGameChatMessage): IGameChatMessage {
        const { message, sender } = data

        return {
            id: message.id,
            text: message.text,
            sender: sender ?? null,
            createdAt: message.createdAt
        }
    }

    async formatGameChatMessageAsync(message: Message): Promise<IGameChatMessage> {
        const chat = await this.chatsService.getOneOrThrow(message.chatId)
        if (chat.type !== ChatType.GAME) {
            throw new Error(`Failed to format message to game chat message. Message not from game chat. Message id: ${message.id}; chat id: ${chat.id}`)
        }

        const game = await this.gamesService.findOneByChatId(chat.id)
        if (!game) {
            throw new Error(`Failed to format message to game chat message. Game not found by chatId. Message id: ${message.id}; chat id: ${chat.id}`)
        }

        if (!message.userId) {
            return this.formatGameChatMessage({ message })
        } else {
            const [player, user] = await Promise.all([
                this.playersService.getOneByUserIdAndGameIdOrThrow(message.userId, game.id),
                this.usersService.getOneOrThrow(message.userId)
            ])

            const sender = this.formatGameChatMessageSender({ player, user })

            return this.formatGameChatMessage({ message, sender })
        }
    }

    async formatGameChatMessagesAsync(messages: Message[]): Promise<IGameChatMessage[]> {
        return Promise.all(
            messages.map(m => this.formatGameChatMessageAsync(m))
        )
    }
}