import { Module } from '@nestjs/common';
import { PregameRoomMembersService } from './pregame-room-members.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { PregameRoomMember } from 'src/models/pregame-room-member.model';

@Module({
	imports: [SequelizeModule.forFeature([PregameRoomMember])],
	providers: [PregameRoomMembersService],
	exports: [PregameRoomMembersService],
})
export class PregameRoomMembersModule { }