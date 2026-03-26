import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

export type EventStatus = 'scheduled' | 'running' | 'paused' | 'ended';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEventDto) {
    const name = dto.name?.trim();

    if (!name) {
      throw new BadRequestException('Event name is required');
    }

    if (!Number.isInteger(dto.timeLimit) || dto.timeLimit <= 0) {
      throw new BadRequestException('timeLimit must be a positive integer');
    }

    return this.prisma.event.create({
      data: {
        name,
        timeLimit: dto.timeLimit,
        createdBy: userId,
        passwordHash: dto.password?.trim() ? dto.password.trim() : null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        timeLimit: true,
        createdBy: true,
        startedAt: true,
        createdAt: true,
      },
    });
  }

  async listScheduledEvents() {
    return this.prisma.event.findMany({
      where: { status: 'scheduled' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        timeLimit: true,
        createdBy: true,
        startedAt: true,
        createdAt: true,
      },
    });
  }

  async getEventDetails(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        status: true,
        timeLimit: true,
        createdBy: true,
        startedAt: true,
        createdAt: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async startEvent(eventId: string, userId: string) {
    return this.updateLifecycle(eventId, userId, 'running');
  }

  async pauseEvent(eventId: string, userId: string) {
    return this.updateLifecycle(eventId, userId, 'paused');
  }

  async endEvent(eventId: string, userId: string) {
    return this.updateLifecycle(eventId, userId, 'ended');
  }

  private async updateLifecycle(eventId: string, userId: string, targetStatus: EventStatus) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.createdBy !== userId) {
      throw new ForbiddenException('Only the creator can update this event');
    }

    if (targetStatus === 'running' && event.status !== 'scheduled' && event.status !== 'paused') {
      throw new BadRequestException('Event can only be started from scheduled or paused status');
    }

    if (targetStatus === 'paused' && event.status !== 'running') {
      throw new BadRequestException('Only running events can be paused');
    }

    if (targetStatus === 'ended' && event.status === 'ended') {
      throw new BadRequestException('Event is already ended');
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: {
        status: targetStatus,
        startedAt: targetStatus === 'running' && !event.startedAt ? new Date() : event.startedAt,
      },
      select: {
        id: true,
        name: true,
        status: true,
        timeLimit: true,
        createdBy: true,
        startedAt: true,
        createdAt: true,
      },
    });
  }
}
