import { Player } from "src/modules/players/model/player";
import { User } from "src/modules/users/model/user.model";

export interface FormatGameChatMessageSender {
    player: Player
    user?: User,
}