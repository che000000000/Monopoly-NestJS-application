import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import indexConfig from 'src/config/index.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [indexConfig],
      isGlobal: true
    })
  ]
})
export class AppModule { }