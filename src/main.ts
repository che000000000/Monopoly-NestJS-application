import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import IORedis from 'ioredis';
import * as connectRedis from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const appLogger = new Logger()

  const configService = app.get(ConfigService)

  const redisUri = configService.get('redis.uri')
  if (!redisUri) {
    throw new Error('Redis URI not configured.')
  }
  const redisClient = new IORedis(redisUri)

  const redisLogger = new Logger('Redis')
  redisClient.on('connect', () => {
    redisLogger.log(`Redis connected! Listening on port ${redisClient.options.port}`)
  })

  const redisStore = new connectRedis.RedisStore({
    client: redisClient,
    prefix: configService.get('sessions.folder') || ':sessions'
  })

  app.use(
    cookieParser(configService.get('session.cookiesSecret') || "secret"),
    session({
      secret: configService.get('session.sessionSecret') || 'secret',
      name: configService.get('session.name') || 'secret',
      resave: true,
      saveUninitialized: false,
      cookie: {
        domain: configService.get('session.domain') || "localhost",
        maxAge: 86400 * 1000, // Доработать
        httpOnly: true, // Доработать
        secure: false, // Доработать
        sameSite: configService.get('session.sameSite') || 'lax'
      },
      store: redisStore,
    })
  )

  app.enableCors({
    origin: configService.get('app.baseUrl'),
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  const appPort = configService.get('app.port') ? configService.get('app.port') : 7505
  await app.listen(appPort).then(
    () => appLogger.log(`Application working on port ${appPort}`)
  )
}

bootstrap()