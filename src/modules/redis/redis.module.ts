import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as connectRedis from 'connect-redis';
import IORedis from 'ioredis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_STORE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUri = configService.get('redis.uri')
        if (!redisUri) {
          throw new Error('Redis URI not configured')
        }
        
        const redisClient = new IORedis(redisUri)
        
        const redisStore = new connectRedis.RedisStore({
          client: redisClient,
          prefix: configService.get('sessions.folder') || ':sessions'
        })
        
        return redisStore
      },
    },
  ],
  exports: ['REDIS_STORE'],
}) 
 
export class RedisModule {}