export type BaseOauthServiceType = {
    name: string,
    clientId: string,
    clientSecret: string,
    authorizeUrl: string,
    accessUrl: string,
    profileUrl: string,
    scope: string[],
    redirectUrl: string
}