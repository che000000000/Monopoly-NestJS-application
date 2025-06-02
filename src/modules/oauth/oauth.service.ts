import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OauthModuleOptionsType, oauthModuleSymbol } from './types/module-options.types';
import { BaseOauthService } from './services/base-oauth.service';

@Injectable()
export class OauthService {
    constructor(@Inject(oauthModuleSymbol) private readonly options: OauthModuleOptionsType) { }

    getServiceByName(service_name: string): BaseOauthService {
        const foundService = this.options.services.find(service => service.name === service_name) 
        if (foundService) return foundService
        else throw new NotFoundException('Oauth service not found')
    }
}