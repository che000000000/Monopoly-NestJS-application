import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { GameDeal } from "src/models/game-deal";
import { ActionCard } from "src/modules/action-cards/model/action-card";
import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { Game } from "src/modules/games/model/game";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GameTurnStage {
    MOVE = 'MOVE',
    THROWING_DICES = 'THROWING_DICES',
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_RENT',
    PAY_TAX = 'PAY_TAX',
    ACTION_CARD = 'ACTION_CARD',
    AYCTION = 'AUCTION',
    DEAL = 'DEAL'
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
        allowNull: false,
        defaultValue: () => GameTurnStage.MOVE
    })
    declare stage: GameTurnStage

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
        type: DataType.INTEGER,
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