import { Module } from '@nestjs/common';
import { ChanceItemsService } from './chance-items.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ActionCard } from 'src/models/action-card';

@Module({
	imports: [
		SequelizeModule.forFeature([ActionCard])
	],
	providers: [ChanceItemsService],
	exports: [ChanceItemsService]
})

export class ChanceItemsModule { }