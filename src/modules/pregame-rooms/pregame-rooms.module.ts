import { forwardRef, Module } from '@nestjs/common';
import { PregameRoomsService } from './pregame-rooms.service';
import { PregameRoomsController } from './pregame-rooms.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoom } from 'src/models/pregame-room.model';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        SequelizeModule.forFeature([PregameRoom]),
        forwardRef(() => UsersModule),
    ],
    providers: [PregameRoomsService],
    controllers: [PregameRoomsController]
})
export class PregameRoomsModule { }