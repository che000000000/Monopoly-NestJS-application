import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { User } from "src/modules/users/model/user.model";
import { v4 } from "uuid";

@Table({ tableName: 'Accounts' })
export class Account extends Model {
    @PrimaryKey
    @Column({
        type: DataType.STRING,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare type: string

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare provider: string

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true,
    })
    declare refreshToken?: string | null

    @Column({
        type: DataType.STRING,
        allowNull: true,
        unique: true,
    })
    declare accessToken?: string | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare expires?: number | null

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare userId: string
}