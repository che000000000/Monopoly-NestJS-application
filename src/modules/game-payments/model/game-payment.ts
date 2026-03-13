import { Column, DataType, ForeignKey, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GamePaymentType {
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_PROPERTY_RENT',
    PAY_TAX = 'PAY_TAX',
    TO_BANK = 'TO_BANK',
    TO_PLAYER = 'TO_PLAYER',
    TO_PLAYERS = 'TO_PLAYERS',
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
    })
    declare amount: number

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    declare isOptional: boolean

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare payerPlayerId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare receiverPaymentPlayerId: string

    @ForeignKey(() => GameTurn)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameTurnId: string
}