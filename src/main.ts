import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const appLogger = new Logger()

  const configService = app.get(ConfigService)

  const appPort = configService.get('app.port') ? configService.get('app.port') : 7505
  await app.listen(appPort).then(
    () => appLogger.log(`Application working on port ${appPort}.`)
  )
}
bootstrap()