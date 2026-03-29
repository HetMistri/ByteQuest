import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProblemService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) { }

  private async deleteFileFromUrl(fileUrl?: string | null) {
    if (!fileUrl) return;

    const client = this.supabaseService.getClient();
    if (!client) return;

    try {
      const url = new URL(fileUrl);
      const bucket = process.env.PROBLEM_BUCKET || 'problem-assets';

      const path = url.pathname.split(`/object/public/${bucket}/`)[1];
      if (!path) return;

      const { error } = await client.storage.from(bucket).remove([path]);

      if (error) console.error('DELETE ERROR:', error);
    } catch (err) {
      console.error('DELETE FAILED:', err);
    }
  }

  async listProblems(eventId: string, requesterId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, createdBy: true },
    });

    if (!event) throw new NotFoundException('Event not found');

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
      select: { id: true, createdBy: true, status: true },
    });

    if (!event) throw new NotFoundException('Event not found');

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

    if (!title) throw new BadRequestException('Problem title is required');
    if (!description) throw new BadRequestException('Problem definition is required');
    if (!solution) throw new BadRequestException('Problem solution is required');

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
  async getCurrentProblem(eventId: string, userId: string, role: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        createdBy: true,
        startedAt: true,
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    // coordinators → see first problem or full list handled elsewhere
    if (role === 'coordinator') {
      return this.prisma.problem.findFirst({
        where: { eventId },
        orderBy: { orderIndex: 'asc' },
      });
    }

    // get all problems ordered
    const problems = await this.prisma.problem.findMany({
      where: { eventId },
      orderBy: { orderIndex: 'asc' },
    });

    if (problems.length === 0) return null;

    // get user submissions
    const submissions = await this.prisma.submission.findMany({
      where: {
        eventId,
        userId,
        isCorrect: true,
      },
      select: {
        problemId: true,
      },
    });

    const solvedSet = new Set(submissions.map((s) => s.problemId));

    // find first unsolved problem
    const nextProblem = problems.find((p) => !solvedSet.has(p.id));

    return nextProblem ?? null;
  }

  async updateProblem(
    coordinatorId: string,
    eventId: string,
    problemId: string,
    dto: UpdateProblemDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, createdBy: true, status: true },
    });

    if (!event) throw new NotFoundException('Event not found');

    if (event.createdBy !== coordinatorId) {
      throw new ForbiddenException('Only the event creator can edit problems');
    }

    if (event.status !== 'scheduled') {
      throw new BadRequestException('Problems are locked once the event starts');
    }

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, eventId: true, resourceFile: true },
    });

    if (!problem || problem.eventId !== eventId) {
      throw new NotFoundException('Problem not found in this event');
    }

    const data: any = {};

    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) throw new BadRequestException('Problem title cannot be empty');
      data.title = title;
    }

    if (dto.description !== undefined) {
      const description = dto.description.trim();
      if (!description) throw new BadRequestException('Problem definition cannot be empty');
      data.description = description;
    }

    if (dto.solution !== undefined) {
      const solution = dto.solution.trim();
      if (!solution) throw new BadRequestException('Problem solution cannot be empty');
      data.correctAnswer = solution;
    }

    if (dto.downloadableContentUrl !== undefined) {
      const newFile = dto.downloadableContentUrl?.trim() || null;

      if (problem.resourceFile && problem.resourceFile !== newFile) {
        await this.deleteFileFromUrl(problem.resourceFile);
      }

      data.resourceFile = newFile;
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
    });
  }
}