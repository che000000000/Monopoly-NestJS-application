import { BelongsTo, Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Account } from "./account.model";
import { Player } from "./player.model";
import { PregameRoom } from "./pregame-room.model";

export enum UserRole {
    regular = 'regular',
    admin = 'admin'
}

export enum AuthMethod {
    credentials = 'credentials',
    google = 'google'
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
    email: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    password?: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    avatarUrl?: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.regular
    })
    role: string

    @Column({
        type: DataType.ENUM(...Object.values(AuthMethod)),
        allowNull: false
    })
    authMethod: string

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    isVerified: boolean

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false
    })
    isTwoFactorEnabled: boolean

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    pregameRoomId: string | null

    @HasOne(() => Account)
    account: Account

    @HasMany(() => Player)
    players: Player[]

    @HasOne(() => PregameRoom, {foreignKey: 'ownerId'})
    owningRoom: PregameRoom
}