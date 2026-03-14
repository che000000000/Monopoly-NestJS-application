import { Module } from '@nestjs/common';
import { ForcedMovesService } from './forced-moves.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ForcedMove } from './model/forced-move';

@Module({
    imports: [SequelizeModule.forFeature([ForcedMove])],
    providers: [ForcedMovesService],
    exports: [ForcedMovesService]
})

export class ForcedMovesModule { }