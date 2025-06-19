import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'src/models/user.model';
import { PregameRoomsModule } from '../pregame-rooms/pregame-rooms.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    forwardRef(() => PregameRoomsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }