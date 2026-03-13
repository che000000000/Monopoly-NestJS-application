import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Player } from "src/modules/players/model/player";
import { v4 } from "uuid";

export enum PlayerCardType {
    GET_OUT_OF_JAIL = 'GET_OUT_OF_JAIL'
}

@Table({ tableName: 'PlayerCards' })
export class PlayerCard extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
        defaultValue: () => v4()
    })
    declare id: string

    @Column({
        type: DataType.ENUM(...Object.values(PlayerCardType)),
        allowNull: false
    })
    declare type: PlayerCardType

    @ForeignKey(() => Player)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    declare playerId: string
}