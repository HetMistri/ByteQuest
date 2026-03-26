import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemService {
  constructor(private readonly prisma: PrismaService) {}

  async listProblems(eventId: string, requesterId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, createdBy: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (role === 'coordinator' && event.createdBy !== requesterId) {
      throw new ForbiddenException('Only event creator can manage problem set');
    }

    return this.prisma.problem.findMany({
      where: { eventId },
      orderBy: { orderIndex: 'asc' },
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
  }

  async addProblem(coordinatorId: string, eventId: string, dto: CreateProblemDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.createdBy !== coordinatorId) {
      throw new ForbiddenException('Only the event creator can add problems');
    }

    if (event.status !== 'scheduled') {
      throw new BadRequestException('Problems can only be added while event is scheduled');
    }

    const title = dto.title?.trim();
    const description = dto.description?.trim();
    const solution = dto.solution?.trim();
    const resourceFile = dto.downloadableContentUrl?.trim();

    if (!title) {
      throw new BadRequestException('Problem title is required');
    }

    if (!description) {
      throw new BadRequestException('Problem definition is required');
    }

    if (!solution) {
      throw new BadRequestException('Problem solution is required');
    }

    let orderIndex = dto.orderIndex;

    if (orderIndex !== undefined) {
      if (!Number.isInteger(orderIndex) || orderIndex <= 0) {
        throw new BadRequestException('orderIndex must be a positive integer');
      }
    } else {
      const maxOrder = await this.prisma.problem.aggregate({
        where: { eventId },
        _max: { orderIndex: true },
      });

      orderIndex = (maxOrder._max.orderIndex ?? 0) + 1;
    }

    return this.prisma.problem.create({
      data: {
        eventId,
        title,
        description,
        correctAnswer: solution,
        resourceFile: resourceFile || null,
        orderIndex,
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
  }

  async updateProblem(coordinatorId: string, eventId: string, problemId: string, dto: UpdateProblemDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        createdBy: true,
        status: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.createdBy !== coordinatorId) {
      throw new ForbiddenException('Only the event creator can edit problems');
    }

    if (event.status !== 'scheduled') {
      throw new BadRequestException('Problems are locked once the event starts');
    }

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, eventId: true },
    });

    if (!problem || problem.eventId !== eventId) {
      throw new NotFoundException('Problem not found in this event');
    }

    const data: {
      title?: string;
      description?: string;
      correctAnswer?: string;
      resourceFile?: string | null;
      orderIndex?: number;
    } = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('Problem title cannot be empty');
      }
      data.title = title;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (!description) {
        throw new BadRequestException('Problem definition cannot be empty');
      }
      data.description = description;
    }

    if (dto.solution !== undefined) {
      const solution = dto.solution.trim();
      if (!solution) {
        throw new BadRequestException('Problem solution cannot be empty');
      }
      data.correctAnswer = solution;
    }

    if (dto.downloadableContentUrl !== undefined) {
      data.resourceFile = dto.downloadableContentUrl.trim() || null;
    }

    if (dto.orderIndex !== undefined) {
      if (!Number.isInteger(dto.orderIndex) || dto.orderIndex <= 0) {
        throw new BadRequestException('orderIndex must be a positive integer');
      }
      data.orderIndex = dto.orderIndex;
    }

    return this.prisma.problem.update({
      where: { id: problemId },
      data,
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
  }

  async getCurrentProblem(eventId: string, userId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        timeLimit: true,
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

    if (!participant && role !== 'coordinator') {
      throw new ForbiddenException('Join the event before viewing the current problem');
    }

    const totalProblems = await this.prisma.problem.count({ where: { eventId } });
    const currentQuestionIndex = participant?.currentQuestion ?? 1;

    const currentProblem = await this.prisma.problem.findFirst({
      where: {
        eventId,
        orderIndex: currentQuestionIndex,
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

    const now = Date.now();
    const totalDurationSeconds = event.timeLimit * 60;
    const totalElapsedSeconds = event.startedAt
      ? Math.max(0, Math.floor((now - new Date(event.startedAt).getTime()) / 1000))
      : 0;

    const problemStartAt = participant?.lastSolvedAt
      ? new Date(participant.lastSolvedAt).getTime()
      : event.startedAt
        ? new Date(event.startedAt).getTime()
        : null;

    const problemTimeSpentSeconds = problemStartAt
      ? Math.max(0, Math.floor((now - problemStartAt) / 1000))
      : 0;

    const solvedCount = Math.max(0, currentQuestionIndex - 1);
    const progressPercent = totalProblems === 0 ? 0 : Math.min(100, Math.floor((solvedCount / totalProblems) * 100));

    return {
      eventId,
      status: event.status,
      currentQuestionIndex,
      totalProblems,
      totalDurationSeconds,
      totalElapsedSeconds,
      problemTimeSpentSeconds,
      progressPercent,
      isCompleted: totalProblems > 0 && !currentProblem,
      currentProblem,
    };
  }
}