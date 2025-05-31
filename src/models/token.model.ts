import { Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";

export enum TokenType {
    verification = 'verification',
    twoFactor = 'two_factor',
    passwordReset = 'password_reset'
}

@Table({ tableName: "Tokens" })
export class Token extends Model {
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
        unique: true,
    })
    email: string

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    token: string

    @Column({
        type: DataType.ENUM(...Object.values(TokenType)),
        allowNull: false,
    })
    tokenType: string

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    expiresIn: Date
}   