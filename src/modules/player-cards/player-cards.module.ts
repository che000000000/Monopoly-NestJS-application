import { Module } from '@nestjs/common';
import { PlayerCardsService } from './player-cards.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PlayerCard } from './model/player-card.model';
import { PlayersModule } from '../players/players.module';

@Module({
    imports: [
        SequelizeModule.forFeature([PlayerCard]),
        PlayersModule
    ],
    providers: [PlayerCardsService],
    exports: [PlayerCardsService]
})

export class PlayerCardsModule { }