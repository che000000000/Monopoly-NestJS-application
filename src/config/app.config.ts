export default () => ({
    port: process.env.APP_PORT,
    host: process.env.APP_HOST,
    get baseURL() {
        return `http://${this.host}:${this.port}`
    }
})