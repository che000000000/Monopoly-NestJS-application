import { DynamicModule, Module } from '@nestjs/common';
import { OauthService } from './oauth.service';
import { AsyncOauthModuleOptionsType, OauthModuleOptionsType, oauthModuleSymbol } from './types/module-options.types';
import { ConfigModule } from '@nestjs/config';

@Module({})
export class OauthModule {
  static forRoot(options: OauthModuleOptionsType): DynamicModule {
    return {
      module: OauthModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: oauthModuleSymbol,
          useValue: options.services
        },
        OauthService
      ],
      exports: [OauthService]
    }
  }

  static forRootAsync(options: AsyncOauthModuleOptionsType): DynamicModule {
    return {
      module: OauthModule,
      imports: options.imports,
      providers: [
        {
          provide: oauthModuleSymbol,
          useFactory: options.useFactory,
          inject: options.inject
        },
        OauthService
      ],
      exports: [OauthService]
    }
  }
}