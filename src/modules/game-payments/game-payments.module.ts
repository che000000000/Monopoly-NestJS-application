import { Module } from '@nestjs/common';
import { GamePaymentsService } from './game-payments.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { GamePayment } from './model/game-payment';

@Module({
	imports: [SequelizeModule.forFeature([GamePayment])],
	providers: [GamePaymentsService],
	exports: [GamePaymentsService]
})

export class GamePaymentsModule { }