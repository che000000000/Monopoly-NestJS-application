import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Game } from "../../games/model/game";
import { User } from "../../users/model/user.model";
import { GameDealItem } from "../../../models/game-deal-item";
import { GameDeal } from "../../../models/game-deal";
import { GameField } from "src/modules/game-fields/model/game-field";
import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { PlayerCard } from "src/modules/player-cards/model/player-card.model";
import { GamePayment } from "src/modules/game-payments/model/game-payment";

export enum PlayerChip {
    CART = 'CART',
    HAT = 'HAT',
    IRON = 'IRON',
    PENGUIN = 'PENGUIN',
    THIMBLE = 'THIMBLE'
}

@Table({ tableName: 'Players' })
export class Player extends Model {
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
    declare turnNumber: number

    @Column({
        type: DataType.ENUM(...Object.values(PlayerChip)),
        allowNull: false
    })
    declare chip: PlayerChip

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: () => true
    })
    declare isActive: boolean

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare balance: number

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameId: string

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare userId: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameFieldId: string

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: () => true
    })
    declare paymentForCircle: boolean

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: () => 0
    })
    declare getOutOfJailCardsCount: number

    @HasOne(() => GameTurn)
    gameTurn: GameTurn

    @HasMany(() => GameField)
    ownFields: GameField[]

    @HasOne(() => GameDeal)
    gameDeal: GameDeal

    @HasMany(() => GameDealItem)
    gameDealItem: GameDealItem[]

    @HasMany(() => PlayerCard)
    playerCards: PlayerCard[]

    @HasMany(() => GamePayment, {
        foreignKey: 'payerPlayerId',
        as: 'sentPayments'
    })
    sentPayments: GamePayment[]

    @HasMany(() => GamePayment, {
        foreignKey: 'receiverPlayerId',
        as: 'receivedPayments'
    })
    receivedPayments: GamePayment[]
}