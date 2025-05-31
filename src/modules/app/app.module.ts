import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import indexConfig from 'src/config/index.config';

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
          password: configService.get('pgdb.password'),
          database: configService.get('pgdb.dbName'),
        }
         if (!connectConfig.host || !connectConfig.port || !connectConfig.username || !connectConfig.database || !connectConfig.password) {
          throw new Error("Failed connect to database. Missing connection params!")
        }
        return {
          ...connectConfig,
          dialect: 'postgres',
          synchronize: true,
          // autoLoadModels: true,
          models: []
        }
      }
    })
  ]
})
export class AppModule { }