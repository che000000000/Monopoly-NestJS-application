import { GameTurn } from "src/modules/game-turns/model/game-turn";
import { IPlayer } from "../../players/interfaces/player";
import { IActionCard } from "../../action-cards/interfaces/action-card";
import { IGamePayment } from "../../game-payments/interfaces/game-payment";

export interface FormatGameTurn {
    gameTurn: GameTurn,
    player: IPlayer,
    gamePayments: IGamePayment[]
    actionCard?: IActionCard,
}