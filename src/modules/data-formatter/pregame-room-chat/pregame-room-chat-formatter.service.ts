import { Injectable } from "@nestjs/common";
import { UsersService } from "src/modules/users/users.service";
import { UsersFormatterService } from "../users/users-formatter.service";
import { Message } from "src/modules/messages/model/message";
import { User } from "src/modules/users/model/user.model";
import { IPregameRoomChatMessage } from "./interfaces/pregame-room-chat-message";

@Injectable()
export class PregameRoomChatFormatterService {
    constructor(
        private readonly usersService: UsersService,
        private readonly usersFormatterService: UsersFormatterService
    ) { }

    formatPregameRoomChatMessage(message: Message, user?: User): IPregameRoomChatMessage {
        return {
            id: message.id,
            text: message.text,
            sender: user
                ? this.usersFormatterService.formatUser(user)
                : null,
            createdAt: message.createdAt
        }
    }

    async formatPregameRoomChatMessageAsync(message: Message): Promise<IPregameRoomChatMessage> {
        const user = message.userId 
            ? await this.usersService.getOneOrThrow(message.userId)
            : undefined

        return this.formatPregameRoomChatMessage(message, user)
    }

    async formatPregameRoomChatMessagesAsync(messages: Message[]): Promise<IPregameRoomChatMessage[]> {
        return await Promise.all(
            messages.map(m => this.formatPregameRoomChatMessageAsync(m))
        )
    }
}