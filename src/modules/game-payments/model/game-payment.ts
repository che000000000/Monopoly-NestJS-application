import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameField } from "src/modules/game-fields/model/game-field";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GamePaymentType {
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_RENT',
    PAY_TAX = 'PAY_TAX',
    BUYOUT_FROM_JAIL = 'BUYOUT_FROM_JAIL',
    TO_BANK = 'TO_BANK',
    ONE_OF_TO_PLAYER = 'ONE_OF_TO_PLAYER',
    TO_PLAYERS = 'TO_PLAYERS',
    PROPERTY_BUILDING = 'PROPERTY_BUILDING'
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
    declare receiverPlayerId: string | null

    @ForeignKey(() => GameTurn)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameTurnId: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare buildingPropertyGameFieldId: string | null
}