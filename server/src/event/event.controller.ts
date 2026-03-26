import { Controller, Get, Param, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorator';
import type { AuthUser } from '../auth/auth.decorator';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventService } from './event.service';
import { JoinEventDto } from '../participant/dto/join-event.dto';
import { ParticipantResponseDto } from '../participant/dto/participant-response.dto';
import { LeaderboardEntryDto } from '../participant/dto/leaderboard-entry.dto';
import { ParticipantService } from '../participant/participant.service';
import { ProblemService } from '../problem/problem.service';
import { CreateProblemDto } from '../problem/dto/create-problem.dto';
import { ProblemResponseDto } from '../problem/dto/problem-response.dto';
import { UpdateProblemDto } from '../problem/dto/update-problem.dto';
import { SubmissionService } from '../submission/submission.service';
import { SubmitAnswerDto } from '../submission/dto/submit-answer.dto';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(AuthGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
    private readonly problemService: ProblemService,
    private readonly submissionService: SubmissionService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Create event (coordinator only)' })
  @ApiResponse({ status: 201, type: EventResponseDto })
  createEvent(@Auth() user: AuthUser, @Body() dto: CreateEventDto) {
    return this.eventService.createEvent(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List scheduled events' })
  @ApiResponse({ status: 200, type: EventResponseDto, isArray: true })
  listScheduledEvents(@Auth() user: AuthUser) {
    return this.eventService.listScheduledEvents(user.sub, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  getEventDetails(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.eventService.getEventDetails(eventId, user.sub, user.role);
  }

  @Post(':id/problems')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Add event problem (coordinator only)' })
  @ApiResponse({ status: 201, type: ProblemResponseDto })
  addProblem(@Param('id') eventId: string, @Auth() user: AuthUser, @Body() dto: CreateProblemDto) {
    return this.problemService.addProblem(user.sub, eventId, dto);
  }

  @Get(':id/problems')
  @ApiOperation({ summary: 'List event problems' })
  @ApiResponse({ status: 200, type: ProblemResponseDto, isArray: true })
  listProblems(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.problemService.listProblems(eventId, user.sub, user.role);
  }

  @Patch(':id/problems/:problemId')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Edit event problem while event is scheduled' })
  @ApiResponse({ status: 200, type: ProblemResponseDto })
  updateProblem(
    @Param('id') eventId: string,
    @Param('problemId') problemId: string,
    @Auth() user: AuthUser,
    @Body() dto: UpdateProblemDto,
  ) {
    return this.problemService.updateProblem(user.sub, eventId, problemId, dto);
  }

  @Get(':id/current-problem')
  @ApiOperation({ summary: 'Get current unlocked problem for user in event' })
  @ApiResponse({ status: 200, description: 'Current problem context with timers and progress' })
  getCurrentProblem(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.problemService.getCurrentProblem(eventId, user.sub, user.role);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles('participant')
  @ApiOperation({ summary: 'Submit answer for current unlocked problem' })
  @ApiResponse({ status: 200, description: 'Submission result and progression state' })
  submitAnswer(@Param('id') eventId: string, @Auth() user: AuthUser, @Body() dto: SubmitAnswerDto) {
    return this.submissionService.submitAnswer(eventId, user.sub, user.role, dto.answer);
  }

  @Get(':id/results/me')
  @ApiOperation({ summary: 'Get personal solving history for the event' })
  @ApiResponse({ status: 200, description: 'Per-problem attempt and solve timings for the user' })
  getPersonalResults(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.submissionService.getPersonalResults(eventId, user.sub, user.role);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join scheduled event (participant flow)' })
  @ApiResponse({ status: 201, type: ParticipantResponseDto })
  joinEvent(@Param('id') eventId: string, @Auth() user: AuthUser, @Body() dto: JoinEventDto) {
    return this.participantService.joinEvent(user.sub, user.role, eventId, dto.password);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'List event participants' })
  @ApiResponse({ status: 200, type: ParticipantResponseDto, isArray: true })
  listParticipants(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.participantService.listParticipants(eventId, user.sub, user.role);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard sorted by score' })
  @ApiResponse({ status: 200, type: LeaderboardEntryDto, isArray: true })
  getLeaderboard(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.participantService.getLeaderboard(eventId, user.sub, user.role);
  }

  @Post(':id/kick/:userId')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Kick participant from event (coordinator only)' })
  @ApiResponse({ status: 200, description: 'Participant kicked' })
  kickParticipant(
    @Param('id') eventId: string,
    @Param('userId') targetUserId: string,
    @Auth() user: AuthUser,
  ) {
    return this.participantService.kickParticipant(user.sub, eventId, targetUserId);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Start event (coordinator only)' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  startEvent(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.eventService.startEvent(eventId, user.sub);
  }

  @Post(':id/pause')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'Pause event (coordinator only)' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  pauseEvent(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.eventService.pauseEvent(eventId, user.sub);
  }

  @Post(':id/end')
  @UseGuards(RolesGuard)
  @Roles('coordinator')
  @ApiOperation({ summary: 'End event (coordinator only)' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  endEvent(@Param('id') eventId: string, @Auth() user: AuthUser) {
    return this.eventService.endEvent(eventId, user.sub);
  }
}
