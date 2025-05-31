import { Column, DataType, Default, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Account } from "./account.model";
import { Player } from "./player.model";

export enum UserRole {
    regular = 'regular',
    admin = 'admin'
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
        allowNull: false
    })
    email: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    name: string

    @Column({
        type: DataType.ENUM(...Object.values(UserRole)),
        allowNull: false,
        defaultValue: UserRole.regular
    })
    role: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    password?: string

    @Default(null)
    @Column({
        type: DataType.STRING,
        allowNull: true,
        defaultValue: null
    })
    avatarUrl?: string

    @HasOne(() => Account)
    account: Account

    @HasMany(() => Player)
    players: Player[]
}