import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import indexConfig from 'src/config/index.config';
import { Account } from 'src/models/account.model';
import { Match } from 'src/models/match.model';
import { Player } from 'src/models/player.model';
import { Token } from 'src/models/token.model';
import { User } from 'src/models/user.model';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [indexConfig],
      isGlobal: true
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectConfig = {
          host: configService.get('pgdb.host'),
          port: configService.get('pgdb.port'),
          username: configService.get('pgdb.username'),
          database: configService.get('pgdb.dbName'),
          password: configService.get('pgdb.password'),
        }
        if (!connectConfig.host || !connectConfig.port || !connectConfig.username || !connectConfig.database || !connectConfig.password) {
          throw new Error("Failed connect to database. Missing connection params!")
        }
        return {
          ...connectConfig,
          dialect: 'postgres',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
          models: [User, Account, Player, Token, Match]
        }
      }
    }),
    UserModule, AuthModule
  ]
})
export class AppModule { }