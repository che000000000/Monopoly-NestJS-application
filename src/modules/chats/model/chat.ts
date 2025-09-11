import { Column, DataType, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Game } from "src/modules/games/model/game";
import { Message } from "src/modules/messages/model/message";
import { PregameRoom } from "src/modules/pregame-rooms/model/pregame-room";
import { ChatMember } from "src/modules/chat-members/model/chat-member";
import { v4 } from "uuid";

export enum ChatType {
    GLOBAL = 'GLOBAL',
    PRIVATE = 'PRIVATE',
    PREGAME = 'PREGAME',
    GAME = 'GAME',
}

@Table({ tableName: 'Chats' })
export class Chat extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(ChatType)),
        allowNull: false
    })
    declare type: ChatType

    @HasMany(() => Message)
    messages: Message[]

    @HasMany(() => ChatMember)
    chatMembers: ChatMember[]

    @HasOne(() => Game)
    game: Game

    @HasOne(() => PregameRoom)
    pregameRoom: PregameRoom
}