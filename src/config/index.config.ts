import appConfig from "./app.config"
import pgdbConfig from "./pgdb.config"
import redisConfig from "./redis.config"
import sessionsConfig from "./sessions.config"

export default () => {
    return {
        app: appConfig(),
        pgdb: pgdbConfig(),
        redis: redisConfig(),
        sessions: sessionsConfig()
    }
}