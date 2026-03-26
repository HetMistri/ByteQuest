import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParticipantService {
  constructor(private readonly prisma: PrismaService) {}

  async joinEvent(userId: string, role: string, eventId: string, password?: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (role === 'coordinator') {
      if (event.status !== 'scheduled' && event.status !== 'running') {
        throw new BadRequestException('Coordinators can only join scheduled or running events');
      }
    } else if (event.status !== 'scheduled') {
      throw new BadRequestException('Participants can only join scheduled events');
    }

    const providedPassword = password?.trim();
    if (event.passwordHash && event.passwordHash !== providedPassword) {
      throw new ForbiddenException('Invalid event password');
    }

    const existingParticipant = await this.prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        userId: true,
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });

    if (existingParticipant) {
      throw new ConflictException('Participant already joined this event');
    }

    if (role !== 'coordinator') {
      const activeParticipation = await this.prisma.participant.findFirst({
        where: {
          userId,
          eventId: { not: eventId },
          event: {
            status: {
              in: ['scheduled', 'running', 'paused'],
            },
          },
        },
        select: {
          eventId: true,
        },
      });

      if (activeParticipation) {
        throw new ConflictException('Participant can join only one active event at a time');
      }
    }

    return this.prisma.participant.create({
      data: {
        userId,
        eventId,
      },
      select: {
        userId: true,
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });
  }

  async listParticipants(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.participant.findMany({
      where: { eventId },
      orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
      select: {
        userId: true,
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });
  }

  async kickParticipant(requesterId: string, eventId: string, targetUserId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.createdBy !== requesterId) {
      throw new ForbiddenException('Only the event creator can kick participants');
    }

    const deleted = await this.prisma.participant.deleteMany({
      where: {
        eventId,
        userId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Participant not found in this event');
    }

    return { success: true };
  }
}
