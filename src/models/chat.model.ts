import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "./game.model";
import { PregameRoom } from "./pregame-room.model";
import { Message } from "./message.model";

export enum tiedTo {
    global = 'global',
    game = 'game',
    pregame = 'pregame'
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
        type: DataType.ENUM(...Object.values(tiedTo)),
        allowNull: false,
    })
    tiedTo: string

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    gameId: string | null

    @ForeignKey(() => PregameRoom)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    pregameRoomId: string | null

    @HasMany(() => Message)
    messages: Message[]
}