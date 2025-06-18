import { type OauthServiceType } from "../types/oauth-service.type";
import { BaseOauthService } from "./base-oauth.service";

export class GoogleOauthService extends BaseOauthService {
    constructor(options: OauthServiceType) {
        super({
            name: 'google',
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            accessUrl: 'https://oauth2.googleapis.com/token',
            profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
            scope: options.scope,
            redirectUrl: options.redirectUrl
        })
    }
}