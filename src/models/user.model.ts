import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Account } from "./account.model";
import { PregameRoom } from "./pregame-room.model";
import { ChatMember } from "./chat-members";
import { Message } from "./message.model";
import { Game } from "./game.model";
import { Player } from "./player.model";

export enum UserRole {
    REGULAR = 'REGULAR',
    ADMIN = 'ADMIN',
    DEV = 'DEV'
}

export enum AuthMethod {
    CREDENTIALS = 'CREDENTIALS',
    GOOGLE = 'GOOGLE'
}

@Table({ tableName: 'Users' })
export class User extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true
    })
    declare email: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null,
        field: 'password'
    })
    declare password: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    declare avatarUrl: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.REGULAR
    })
    declare role: UserRole

    @Column({
        type: DataType.ENUM(...Object.values(AuthMethod)),
        allowNull: false
    })
    declare authMethod: AuthMethod

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isVerified: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    declare isTwoFactorEnabled: boolean

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare pregameRoomId: string | null

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare gameId: string | null

    @HasMany(() => ChatMember)
    chatMembers: ChatMember[]

    @HasMany(() => Message)
    messages: Message[]

    @HasOne(() => Account)
    account: Account

    @HasOne(() => PregameRoom)
    owningRoom: PregameRoom

    @HasOne(() => Player)
    player: Player
}