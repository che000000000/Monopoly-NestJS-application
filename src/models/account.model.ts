import { Column, DataType, Default, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";

@Table({ tableName: 'Accounts' })
export class Account extends Model {
    @PrimaryKey
    @Default(v4)
    @Column({
        type: DataType.STRING,
    })
    id: string = v4()

    @Column({
        type: DataType.STRING,
    })
    type: string

    @Column({
        type: DataType.STRING,
    })
    provider: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true,
    })
    refreshToken?: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true,
    })
    accessToken?: string

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    expiresAt?: number

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId: string
}