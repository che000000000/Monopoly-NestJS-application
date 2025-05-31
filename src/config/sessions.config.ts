export default () => ({
    secret: process.env.SESSIONS_SECRET,
    cookieSecret: process.env.COOKIE_SECRET,
    name: process.env.SESSIONS_NAME,
    domain: process.env.SESSIONS_DOMAIN,
    sameSite: process.env.SESSIONS_SAME_SITE,
    folder: process.env.SESSIONS_FOLDER
})