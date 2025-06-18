import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MatchesGateway } from "./matches.gateway";
import { UsersModule } from "../users/users.module";
import { WsAuthGuard } from "./guards/wsAuth.guard";

@Module({
    imports: [ConfigModule, UsersModule],
    providers: [MatchesGateway, WsAuthGuard]
})

export class GatewayModule { }