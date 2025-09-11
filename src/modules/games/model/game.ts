import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "../../players/model/player";
import { ActionCard } from "src/modules/action-cards/model/action-card";
import { Chat } from "src/modules/chats/model/chat";
import { GameField } from "src/modules/game-fields/model/game-field";
import { GameTurn } from "src/modules/game-turns/model/game-turn";

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

    @ForeignKey(() => Chat)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare chatId: string

    @HasMany(() => Player)
    players: Player[]

    @HasMany(() => GameField)
    fields: GameField[]

    @HasOne(() => GameTurn)
    turn: GameTurn

    @HasMany(() => ActionCard)
    actionCards: ActionCard[]
}