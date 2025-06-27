import { Column, DataType, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";

export enum TokenType {
    VERIFICATION = 'VERIFICATION',
    TWO_FACTOR = 'TWO_FACTOR',
    PASSSWORD_RESET = 'PASSWORD_RESET'
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
    declare email: string

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    declare token: TokenType

    @Column({
        type: DataType.ENUM(...Object.values(TokenType)),
        allowNull: false,
    })
    declare tokenType: string

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    declare expiresIn: Date
}   