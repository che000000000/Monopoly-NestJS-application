import { AllowNull, Column, DataType, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Chat } from "./chat.model";
import { Player } from "./player.model";
import { GameField } from "./game-field.model";
import { GameTurn } from "./game-turn.model";

@Table({ tableName: 'Games' })
export class Game extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare houses: number

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare hotels: number

    @HasOne(() => Chat)
    chat: Chat

    @HasMany(() => Player)
    players: Player[]

    @HasMany(() => GameField)
    fields: GameField[]

    @HasOne(() => GameTurn)
    turn: GameTurn
}