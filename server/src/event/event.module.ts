import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AuthModule } from '../auth/auth.module';
import { ParticipantModule } from '../participant/participant.module';

@Module({
  imports: [AuthModule, ParticipantModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
