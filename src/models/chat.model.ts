import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { PregameRoom } from "./pregame-room.model";
import { Message } from "./message.model";
import { ChatMember } from "./chat-members";

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