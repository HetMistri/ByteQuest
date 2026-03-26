import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { AuthModule } from '../auth/auth.module';
import { ParticipantModule } from '../participant/participant.module';
import { ProblemModule } from '../problem/problem.module';
import { SubmissionModule } from '../submission/submission.module';

@Module({
  imports: [AuthModule, ParticipantModule, ProblemModule, SubmissionModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
