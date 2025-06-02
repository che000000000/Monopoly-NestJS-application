import { BadRequestException } from "@nestjs/common";
import { BaseOauthServiceType } from "../types/base-oauth-service.type";

export class BaseOauthService {
    constructor(
        private readonly options: BaseOauthServiceType) { }

    constructOauthUrl(): string {
        const querry = new URLSearchParams({
            client_id: this.options.clientId,
            redirect_uri: this.options.redirectUrl,
            response_type: 'code',
            scope: (this.options.scope ?? []).join(' '),
            access_type: 'offline',
            prompt: 'select_account'
        })
        return `${this.options.authorizeUrl}?${querry}`
    }

    async getUserByCode(code: string) {
        const querry = new URLSearchParams({
            client_id: this.options.clientId,
            client_secret: this.options.clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: this.options.redirectUrl
        })

        const getAccessRequest = await fetch(this.options.accessUrl, {
            method: 'POST',
            headers: {
                Host: 'oauth2.googleapis.com',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: querry
        })
        const getAccessResponse = await getAccessRequest.json()

        if(!await getAccessResponse.access_token) {
            throw new BadRequestException('Response do not contains access token.')
        }

        const getUserRequest = await fetch(this.options.profileUrl, {
            headers: {
                Authorization: `Bearer ${getAccessResponse.access_token}`
            }
        })
        return await getUserRequest.json()
    }

    get name() {
        return this.options.name
    }
}