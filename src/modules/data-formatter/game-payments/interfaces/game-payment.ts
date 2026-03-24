import { GamePaymentType } from "src/modules/game-payments/model/game-payment";
import { IPlayer } from "../../players/interfaces/player";
import { IGameField } from "../../game-fields/interfaces/game-field";

export interface IGamePayment {
    id: string,
    type: GamePaymentType,
    amount: number,
    payerPlayer: IPlayer,
    receiverPaymentPlayer: IPlayer | null,
    isOptional: boolean,
    buildingPropertyGameField: IGameField | null
}