export default () => ({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    get uri() {
        return `redis://${this.username}:${this.password}@${this.host}:${this.port}`
    }
})