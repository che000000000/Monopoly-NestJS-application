import { Module } from '@nestjs/common';
import { ActionCardsService } from './action-cards.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActionCard } from './model/action-card';

@Module({
	imports: [
		SequelizeModule.forFeature([ActionCard])
	],
	providers: [ActionCardsService],
	exports: [ActionCardsService]
})

export class ActionsCardsModule { }