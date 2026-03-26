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

    const existingParticipant = await this.prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            displayName: true,
          },
        },
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });

    if (existingParticipant) {
      if (event.status === 'ended') {
        throw new BadRequestException('Event is ended and cannot be rejoined');
      }

      return {
        userId: existingParticipant.userId,
        displayName: existingParticipant.user?.displayName ?? null,
        eventId: existingParticipant.eventId,
        currentQuestion: existingParticipant.currentQuestion,
        score: existingParticipant.score,
        flags: existingParticipant.flags,
        joinedAt: existingParticipant.joinedAt,
      };
    }

    if (role === 'coordinator') {
      if (event.status === 'ended') {
        throw new BadRequestException('Coordinators can only join active events');
      }
    } else if (event.status !== 'scheduled') {
      throw new BadRequestException('Participants can only join scheduled events');
    }

    if (role !== 'coordinator') {
      const providedPassword = password?.trim();
      if (event.passwordHash && event.passwordHash !== providedPassword) {
        throw new ForbiddenException('Invalid event password');
      }
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

    const createdParticipant = await this.prisma.participant.create({
      data: {
        userId,
        eventId,
      },
      select: {
        userId: true,
        user: {
          select: {
            displayName: true,
          },
        },
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });

    return {
      userId: createdParticipant.userId,
      displayName: createdParticipant.user?.displayName ?? null,
      eventId: createdParticipant.eventId,
      currentQuestion: createdParticipant.currentQuestion,
      score: createdParticipant.score,
      flags: createdParticipant.flags,
      joinedAt: createdParticipant.joinedAt,
    };
  }

  async listParticipants(eventId: string, requesterId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, status: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const participantFilter =
      role === 'coordinator' || event.status === 'ended'
        ? { eventId }
        : {
            eventId,
            userId: requesterId,
          };

    const participants = await this.prisma.participant.findMany({
      where: participantFilter,
      orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
      select: {
        userId: true,
        user: {
          select: {
            displayName: true,
          },
        },
        eventId: true,
        currentQuestion: true,
        score: true,
        flags: true,
        joinedAt: true,
      },
    });

    return participants.map((participant) => ({
      userId: participant.userId,
      displayName: participant.user?.displayName ?? null,
      eventId: participant.eventId,
      currentQuestion: participant.currentQuestion,
      score: participant.score,
      flags: participant.flags,
      joinedAt: participant.joinedAt,
    }));
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
