import { Injectable } from "@nestjs/common";
import { GameFieldsService } from "src/modules/game-fields/game-fields.service";
import { GameFieldsFormatterService } from "../game-fields/game-fields-formatter.service";
import { ForcedMove } from "src/modules/forced-moves/model/forced-move";
import { IForcedMove } from "./interfaces/forced-move";
import { IGameField } from "../game-fields/interfaces/game-field";

@Injectable()
export class ForcedMovesFormatterService {
    constructor(
        private readonly gameFieldsService: GameFieldsService,
        private readonly gameFieldsFormatterService: GameFieldsFormatterService
    ) { }

    private formatForcedMove(forcedMove: ForcedMove, fromGameField: IGameField, toGameField: IGameField): IForcedMove {
        return {
            id: forcedMove.id,
            fromGameField,
            toGameField
        }
    }

    async formatForcedMoveAsync(forcedMove: ForcedMove): Promise<IForcedMove> {
        const [from, to] = await Promise.all([
            this.gameFieldsFormatterService.formatGameFieldAsync(
                await this.gameFieldsService.getOneOrThrow(forcedMove.fromGameFieldId)
            ),
            this.gameFieldsFormatterService.formatGameFieldAsync(
                await this.gameFieldsService.getOneOrThrow(forcedMove.toGameFieldId)
            )
        ])

        return this.formatForcedMove(forcedMove, from, to)
    }
}