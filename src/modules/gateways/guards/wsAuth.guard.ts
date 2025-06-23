import { CanActivate, ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Redis } from 'ioredis';
import { ErrorTypes } from '../filters/WsExcepton.filter';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(
    @Inject('REDIS_STORE') private readonly redisStore: { client: Redis },
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();

    const redisSession = await this.redisStore.client.get(`:sessions${client.request.sessionID}`)

    if (!redisSession) {
      throw new WsException(
        {
          errorType: ErrorTypes.Unauthorized,
          message: 'User not authorized.'
        }
      )
    }

    return true
  }
}