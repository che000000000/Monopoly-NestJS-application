import { GamePayment } from "src/modules/game-payments/model/game-payment";
import { IPlayer } from "../../players/interfaces/player";

export interface FormatGamePayment {
    gamePayment: GamePayment,
    payerPlayer: IPlayer,
    receiverPaymentPlayer?: IPlayer
}