import appConfig from "./app.config"
import pgdbConfig from "./pgdb.config"

export default () => {
    return {
        app: appConfig(),
        pgdb: pgdbConfig()
    }
}