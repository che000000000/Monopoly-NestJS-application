import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "../../users/model/user.model";
import { Chat } from "src/modules/chats/model/chat";

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
    declare text: string

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare chatId: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare userId: string | null
}