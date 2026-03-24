import { Column, DataType, ForeignKey, HasMany, HasOne, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Game } from "src/modules/games/model/game";
import { Monopoly, MonopolyColor } from "src/modules/monopolies/model/monopoly";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum GameFieldType {
    PROPERTY = 'PROPERTY',
    RAILROAD = 'RAILROAD',
    UTILITY = 'UTILITY',
    CHANCE = 'CHANCE',
    COMMUNITY_CHEST = 'COMMUNITY_CHEST',
    TAX = 'TAX',
    JUST_VISITING = 'JUST_VISITING',
    GO_TO_JAIL = 'GO_TO_JAIL',
    FREE_PARKING = 'FREE_PARKING',
    GO = 'GO'
}

@Table({ tableName: 'GameFields' })
export class GameField extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(GameFieldType)),
        allowNull: false
    })
    declare type: GameFieldType

    @Column({
        type: DataType.ENUM(...Object.values(MonopolyColor)),
        allowNull: true
    })
    declare color: MonopolyColor | null

    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare position: number

    @Column({
        type: DataType.ARRAY(DataType.INTEGER),
        allowNull: true
    })
    declare rent: number[] | null

    @Column({
        type: DataType.STRING,
        allowNull: false
    })
    declare name: string

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare basePrice: number | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare housePrice: number | null

    @Column({
        type: DataType.INTEGER,
        allowNull: true
    })
    declare buildsCount: number | null

    @ForeignKey(() => Game)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    declare gameId: string

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    declare ownerPlayerId: string | null

    @ForeignKey(() => Monopoly)
    @Column({
        type: DataType.UUID,
        allowNull: true
    })
    declare monopolyId: string | null

    @HasMany(() => Player)
    standingPlayers: Player[]
}