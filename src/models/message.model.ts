import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "./chat.model";
import { User } from "./user.model";

@Table({ tableName: 'Messages' })
export class Message extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4() 
    })
    declare id: string

    @Column({
        type: DataType.TEXT,
        allowNull: false
    })
    text: string

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    chatId: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId: string
}