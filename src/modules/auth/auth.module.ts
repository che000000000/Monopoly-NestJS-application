import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { OauthModule } from '../oauth/oauth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OauthModuleOptionsType } from '../oauth/types/module-options.types';
import { GoogleOauthService } from '../oauth/services/google.service';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    UsersModule,
    AccountsModule,
    OauthModule.forRootAsync({
      imports: [ConfigModule, AccountsModule, UsersModule],
      useFactory: async (configServide: ConfigService): Promise<OauthModuleOptionsType> => ({
        services: [
          new GoogleOauthService({
            clientId: configServide.getOrThrow('oauth.google.clientId'),
            clientSecret: configServide.getOrThrow('oauth.google.clientSecret'),
            scope: ['email', 'profile'],
            redirectUrl: `${configServide.get('app.baseURL')}/auth/oauth/callback/google`
          })
        ]
      }),
      inject: [ConfigService]
    })
  ],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule { }