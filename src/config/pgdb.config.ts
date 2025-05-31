export default () => ({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    username: process.env.POSTGRES_USERNAME,
    dbName: process.env.POSTGRES_DB_NAME,
    password: process.env.POSTGRES_PASSWORD
})