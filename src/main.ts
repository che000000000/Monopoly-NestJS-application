import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { SessionSocketAdapter } from './webSocketAdapter';
import { WsExceptionsFilter } from './modules/gateways/filters/WsExcepton.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const appLogger = new Logger()

  app.useGlobalFilters(new WsExceptionsFilter())

  const configService = app.get(ConfigService)

  const redisStore = app.get('REDIS_STORE')

  app.use(
    cookieParser(configService.get('sessions.cookieSecret')),
    session({
      secret: configService.get('sessions.secret') || 'secret',
      name: configService.get('sessions.name'),
      resave: true,
      saveUninitialized: false,
      cookie: {
        domain: configService.get('sessions.domain'),
        maxAge: 86400 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: configService.get('sessions.sameSite')
      },
      store: redisStore,
    })
  )

  app.useWebSocketAdapter(new SessionSocketAdapter(app, configService, redisStore))

  app.enableCors({
    origin: configService.get('app.baseURL'),
    credentials: true,
    exposedHeaders: ['set-cookie']
  })

  const appPort = configService.get('app.port') ? configService.get('app.port') : 7505
  await app.listen(appPort).then(
    () => appLogger.log(`Application working on port ${appPort}`)
  )
}

bootstrap()