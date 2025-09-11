import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { GameField } from "./game-field.model";
import { Player } from "./player.model";
import { GameDeal } from "./game-deal";

export enum GameDealItemType {
    GAME_FIELD = 'GAME_FIELD',
    MONEY = 'MONEY'
}

@Table({ tableName: 'GameDealItems' })
export class GameDealItem extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(GameDealItemType)),
        allowNull: false
    })
    declare gameDealItemType: GameDealItemType

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare playerId: string

    @ForeignKey(() => GameField)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare gameFieldId: string | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare money: number | null

    @ForeignKey(() => GameDeal)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameDealId: string
}