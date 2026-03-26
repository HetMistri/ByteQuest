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

  async listScheduledEvents(userId: string, role: string) {
    const whereClause =
      role === 'coordinator'
        ? {
            status: { in: ['scheduled', 'running', 'paused'] as EventStatus[] },
          }
        : {
            OR: [
              { status: 'scheduled' as EventStatus },
              {
                status: { in: ['running', 'paused'] as EventStatus[] },
                participants: {
                  some: {
                    userId,
                  },
                },
              },
            ],
          };

    return this.prisma.event.findMany({
      where: whereClause,
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

  async getEventDetails(eventId: string, userId: string, role: string) {
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
        _count: {
          select: {
            problems: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const participant = await this.prisma.participant.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      select: {
        currentQuestion: true,
        lastSolvedAt: true,
      },
    });

    const totalProblems = event._count.problems;
    const now = Date.now();
    const totalDurationSeconds = event.timeLimit * 60;
    const startedAtMs = event.startedAt ? new Date(event.startedAt).getTime() : null;
    const totalElapsedSeconds = startedAtMs
      ? Math.min(totalDurationSeconds, Math.max(0, Math.floor((now - startedAtMs) / 1000)))
      : 0;
    const timeRemainingSeconds = Math.max(0, totalDurationSeconds - totalElapsedSeconds);

    const baseResponse = {
      id: event.id,
      name: event.name,
      status: event.status,
      timeLimit: event.timeLimit,
      createdBy: event.createdBy,
      startedAt: event.startedAt,
      createdAt: event.createdAt,
      totalProblems,
      totalDurationSeconds,
      totalElapsedSeconds,
      timeRemainingSeconds,
    };

    if (!participant) {
      return baseResponse;
    }

    const currentProblem = await this.prisma.problem.findFirst({
      where: {
        eventId,
        orderIndex: participant.currentQuestion,
      },
      select: {
        id: true,
        eventId: true,
        title: true,
        description: true,
        resourceFile: true,
        orderIndex: true,
        createdAt: true,
      },
    });

    const problemStartAt = participant.lastSolvedAt
      ? new Date(participant.lastSolvedAt).getTime()
      : startedAtMs
        ? startedAtMs
        : null;

    const problemTimeSpentSeconds = problemStartAt
      ? Math.max(0, Math.floor((now - problemStartAt) / 1000))
      : 0;

    const solvedCount = Math.max(0, participant.currentQuestion - 1);
    const progressPercent = totalProblems === 0 ? 0 : Math.min(100, Math.floor((solvedCount / totalProblems) * 100));

    let userTotalTimeSpentSeconds = totalElapsedSeconds;
    if (!currentProblem && participant.lastSolvedAt && startedAtMs) {
      userTotalTimeSpentSeconds = Math.min(
        totalDurationSeconds,
        Math.max(0, Math.floor((new Date(participant.lastSolvedAt).getTime() - startedAtMs) / 1000)),
      );
    }

    return {
      ...baseResponse,
      currentQuestionIndex: participant.currentQuestion,
      totalDurationSeconds,
      totalElapsedSeconds,
      problemTimeSpentSeconds,
      userTotalTimeSpentSeconds,
      progressPercent,
      currentProblem,
      canSubmit: role === 'participant' && event.status === 'running' && Boolean(currentProblem),
    };
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

    if (targetStatus === 'running' && event.status === 'scheduled') {
      const problemCount = await this.prisma.problem.count({ where: { eventId } });
      if (problemCount === 0) {
        throw new BadRequestException('Add at least one problem before starting the event');
      }

      await this.prisma.participant.updateMany({
        where: { eventId },
        data: {
          currentQuestion: 1,
          lastSolvedAt: null,
        },
      });
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
