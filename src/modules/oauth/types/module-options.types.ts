import { FactoryProvider, ModuleMetadata } from "@nestjs/common"
import { BaseOauthService } from "../services/base-oauth.service"

export const oauthModuleSymbol = Symbol()

export type OauthModuleOptionsType = {
    services: BaseOauthService[]
}

export type AsyncOauthModuleOptionsType = (
    Pick<ModuleMetadata, 'imports'> & 
    Pick<FactoryProvider<OauthModuleOptionsType>, 'useFactory' | 'inject'>
)