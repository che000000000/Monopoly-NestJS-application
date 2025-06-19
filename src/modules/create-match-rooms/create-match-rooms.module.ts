import { Module } from '@nestjs/common';
import { CreateMatchRoomsService } from './create-match-rooms.service';

@Module({
  providers: [CreateMatchRoomsService]
})
export class CreateMatchRoomsModule {}