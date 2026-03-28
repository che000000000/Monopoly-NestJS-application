import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameDeal } from "src/models/game-deal";
import { ActionCard } from "src/modules/action-cards/model/action-card";
import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { Game } from "src/modules/games/model/game";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GameTurnStage {
    WAITING_FOR_MOVE = 'WAITING_FOR_MOVE',
    ROLL_OF_DICE_FOR_MOVE = 'ROLL_OF_DICE_FOR_MOVE',
    ROLL_OF_DICE_FOR_GET_OUT_OF_JAIL = 'ROLL_OF_DICE_FOR_GET_OUT_OF_JAIL',
    MOVING = 'MOVING',
    MOVING_OUT_OF_JAIL = 'MOVING_OUT_OF_JAIL',
    HIT_ON_GO_TO_JAIL = 'HIT_ON_GO_TO_JAIL',
    MOVING_TO_JAIL = 'MOVING_TO_JAIL',
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_RENT',
    PAY_TAX = 'PAY_TAX',
    AT_JAIL = 'AT_JAIL',
    BUYOUT_FROM_JAIL = 'BUYOUT_FROM_JAIL',
    ACTION_CARD_SHOWTIME = 'ACTION_CARD_SHOWTIME',
    TO_BANK_PAYMENT = 'TO_BANK_PAYMENT',
    TO_PLAYERS_PAYMENT = 'PAY_PLAYERS',
    GET_PAYMENT_FROM_PLAYERS = 'GET_PAYMENT_FROM_PLAYERS',
    AYCTION = 'AUCTION',
    DEAL = 'DEAL'
}

export enum MovementType {
    CLOCKWISE = 'CLOCKWISE',
    COUNTERCLOCKWISE = 'COUNTERCLOCKWISE',
    DIRECT = 'DIRECT'
}

@Table({ tableName: 'GameTurns' })
export class GameTurn extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(GameTurnStage)),
        allowNull: false
    })
    declare stage: GameTurnStage

    @Column({
        type: DataType.ENUM(...Object.values(MovementType)),
        allowNull: false,
        defaultValue: () => MovementType.CLOCKWISE
    })
    declare movementType: MovementType

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: () => 0
    })
    declare stepsCount: number

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: () => false
    })
    declare isDouble: boolean

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: () => 0
    })
    declare doublesCount: number

    @Column({
        type: DataType.FLOAT,
        allowNull: false
    })
    declare expires: number

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare playerId: string

    @ForeignKey(() => ActionCard)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare actionCardId: string | null

    @HasOne(() => GameDeal)
    gameDeal: GameDeal

    @HasMany(() => GamePayment)
    gamePayments: GamePayment[]
}