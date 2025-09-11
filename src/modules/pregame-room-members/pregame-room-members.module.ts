import { Module } from '@nestjs/common';
import { PregameRoomMembersService } from './pregame-room-members.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoomMember } from './model/pregame-room-member';

@Module({
	imports: [SequelizeModule.forFeature([PregameRoomMember])],
	providers: [PregameRoomMembersService],
	exports: [PregameRoomMembersService],
})
export class PregameRoomMembersModule { }