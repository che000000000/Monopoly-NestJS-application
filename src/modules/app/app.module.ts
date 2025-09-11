import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import indexConfig from 'src/config/index.config';
import { Token } from 'src/models/token.model';
import { User } from 'src/modules/users/model/user.model';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { AccountsModule } from '../accounts/accounts.module';
import { Game } from 'src/modules/games/model/game';
import { PregameRoom } from 'src/modules/pregame-rooms/model/pregame-room';
import { Message } from 'src/modules/messages/model/message';
import { GamesModule } from '../games/games.module';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { ChatMember } from 'src/modules/chat-members/model/chat-member';
import { ChatsModule } from '../chats/chats.module';
import { ChatMembersModule } from '../chat-members/chat-members.module';
import { MessagesModule } from '../messages/messages.module';
import { RedisModule } from 'src/modules/redis/redis.module';
import { Player } from 'src/modules/players/model/player';
import { PlayersModule } from '../players/players.module';
import { PregameRoomMembersModule } from '../pregame-room-members/pregame-room-members.module';
import { DataFormatterModule } from '../data-formatter/data-formatter.module';
import { GlobalChatsModule } from '../global-chat/global-chats.module';
import { GameDeal } from 'src/models/game-deal';
import { GameDealItem } from 'src/models/game-deal-item';
import { GamesMasterModule } from '../games-master/games-master.module';
import { ActionsCardsModule } from '../action-cards/action-cards.module';
import { Account } from '../accounts/model/account.model';
import { ActionCard } from '../action-cards/model/action-card';
import { Chat } from '../chats/model/chat';
import { GameField } from '../game-fields/model/game-field';
import { GameTurn } from '../game-turns/model/game-turn';
import { PregameRoomMember } from '../pregame-room-members/model/pregame-room-member';

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
            GameField, GameDeal, GameDealItem,
            ActionCard
          ]
        }
      }
    }),
    RedisModule, AuthModule, AccountsModule,
    UsersModule, PregameRoomsModule, PregameRoomMembersModule,
    GatewaysModule, ChatsModule, ChatMembersModule,
    MessagesModule, GamesModule, PlayersModule,
    DataFormatterModule, GlobalChatsModule, GamesMasterModule,
    ActionsCardsModule
  ],
})
export class AppModule { }