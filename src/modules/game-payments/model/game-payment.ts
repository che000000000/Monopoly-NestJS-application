import { Column, DataType, ForeignKey, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { Game } from "src/modules/games/model/game";
import { v4 } from "uuid";

export enum GamePaymentType {
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_PROPERTY_RENT',
    PAY_TAX = 'PAY_TAX',
    PAY_ACTION_CARD = 'PAY_ACTION_CARD',
    PAY_PLAYERS = 'PAY_PLAYERS',
    PROPERTY_REPAIR = 'PROPERTY_REPAIR'
}

@Table({ tableName: 'GamePayments' })
export class GamePayment extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(GamePaymentType)),
        allowNull: false
    })
    declare type: GamePaymentType

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: () => 0
    })
    declare amount: number

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameId: string

    @HasOne(() => GameTurn)
    gameTurn: GameTurn
}