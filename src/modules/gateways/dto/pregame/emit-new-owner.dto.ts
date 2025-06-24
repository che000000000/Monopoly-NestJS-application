import { PregameRoom } from "src/models/pregame-room.model";
import { User } from "src/models/user.model";

export class EmitNewOwnerDto {
    newOwner: User
    pregameRoom: PregameRoom
}