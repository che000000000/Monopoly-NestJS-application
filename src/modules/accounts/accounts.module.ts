import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Account } from 'src/models/account.model';

@Module({
  imports: [SequelizeModule.forFeature([Account])],
  providers: [AccountsService],
  exports: [AccountsService]
})
export class AccountsModule {}