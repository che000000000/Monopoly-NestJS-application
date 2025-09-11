import { Column, DataType, ForeignKey, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { Player } from "./player.model";
import { Game } from "./game.model";
import { GameDeal } from "./game-deal";

export enum GameTurnStage {
    MOVE = 'MOVE',
    BUY_GAME_FIELD = 'BUY_GAME_FIELD',
    PAY_RENT = 'PAY_RENT',
    PAY_TAX = 'PAY_TAX',
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

    @HasOne(() => GameDeal)
    gameDeal: GameDeal
}