import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { GameTurn } from "./game-turn.model";
import { Player } from "./player.model";
import { GameDealItem } from "./game-deal-item";

@Table({ tableName: 'GameDeals' })
export class GameDeal extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @ForeignKey(() => GameTurn)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare gameTurnId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare creatorPlayerId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare consideringPlayerId: string

    @HasMany(() => GameDealItem)
    gameDealItem: GameDealItem[]
}