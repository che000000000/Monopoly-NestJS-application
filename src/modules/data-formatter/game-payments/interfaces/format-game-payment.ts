import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { IPlayer } from "../../players/interfaces/player";
import { IGameField } from "../../game-fields/interfaces/game-field";

export interface FormatGamePayment {
    gamePayment: GamePayment,
    payerPlayer: IPlayer,
    receiverPaymentPlayer?: IPlayer,
    buildingPropertyGameField?: IGameField
}