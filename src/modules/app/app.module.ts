import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import indexConfig from 'src/config/index.config';
import { Account } from 'src/models/account.model';
import { Token } from 'src/models/token.model';
import { User } from 'src/models/user.model';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { Game } from 'src/models/game.model';
import { PregameRoom } from 'src/models/pregame-room.model';
import { Chat } from 'src/models/chat.model';
import { Message } from 'src/models/message.model';
import { GamesModule } from '../games/games.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { ChatMember } from 'src/models/chat-members';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { MessagesModule } from '../messages/messages.module';
import { RedisModule } from 'src/modules/redis/redis.module';
import { Player } from 'src/models/player.model';
import { PlayersModule } from '../players/players.module';
import { GameTurn } from 'src/models/game-turn.model';
import { GameField } from 'src/models/game-field.model';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';
import { ResponseFormatterModule } from '../response-formatter/response-formatter.module';

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
          models: [
            User, Account, Token,
            PregameRoom, PregameRoomMember,
            Chat, Message, ChatMember,
            Game, Player, GameTurn,
            GameField
          ]
        }
      }
    }),
    RedisModule, AuthModule, AccountsModule,
    UsersModule, PregameRoomsModule, PregameRoomMembersModule,
    GatewaysModule, ChatsModule, ChatMembersModule,
    MessagesModule, GamesModule, PlayersModule,
    ResponseFormatterModule
  ],
})
export class AppModule { }