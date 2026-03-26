import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
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
import { ParticipantService } from '../participant/participant.service';

@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(AuthGuard)
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly participantService: ParticipantService,
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
  listScheduledEvents() {
    return this.eventService.listScheduledEvents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event details' })
  @ApiResponse({ status: 200, type: EventResponseDto })
  getEventDetails(@Param('id') eventId: string) {
    return this.eventService.getEventDetails(eventId);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join scheduled event (participant flow)' })
  @ApiResponse({ status: 201, type: ParticipantResponseDto })
  joinEvent(@Param('id') eventId: string, @Auth() user: AuthUser, @Body() dto: JoinEventDto) {
    return this.participantService.joinEvent(user.sub, eventId, dto.password);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'List event participants' })
  @ApiResponse({ status: 200, type: ParticipantResponseDto, isArray: true })
  listParticipants(@Param('id') eventId: string) {
    return this.participantService.listParticipants(eventId);
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
