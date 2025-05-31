import { Column, DataType, ForeignKey, Model, PrimaryKey, Table } from "sequelize-typescript";
import { v4 } from "uuid";
import { User } from "./user.model";
import { Match } from "./match.model";

@Table({ tableName: 'Players'})
export class Player extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    id: string = v4()

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    userId: string

    @ForeignKey(() => Match)
    @Column({
        type: DataType.UUID,
        allowNull: false
    })
    matchId: string
}