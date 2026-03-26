import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionService {
  constructor(private readonly prisma: PrismaService) {}

  async submitAnswer(eventId: string, userId: string, role: string, answer: string) {
    if (role !== 'participant') {
      throw new ForbiddenException('Only participants can submit answers');
    }

    const submittedAnswer = answer?.trim();
    if (!submittedAnswer) {
      throw new BadRequestException('Answer is required');
    }

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

    if (event.status !== 'running') {
      throw new BadRequestException('Submissions are allowed only while event is running');
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
      },
    });

    if (!participant) {
      throw new ForbiddenException('Join the event before submitting answers');
    }

    const currentProblem = await this.prisma.problem.findFirst({
      where: {
        eventId,
        orderIndex: participant.currentQuestion,
      },
      select: {
        id: true,
        correctAnswer: true,
      },
    });

    if (!currentProblem) {
      throw new BadRequestException('No unlocked problem is available for submission');
    }

    const normalize = (value: string) => value.trim().toLowerCase();
    const isCorrect = normalize(submittedAnswer) === normalize(currentProblem.correctAnswer);

    let isFirstCorrect = false;
    if (isCorrect) {
      const firstCorrect = await this.prisma.submission.findFirst({
        where: {
          problemId: currentProblem.id,
          eventId,
          isCorrect: true,
        },
        select: { id: true },
      });

      isFirstCorrect = !firstCorrect;
    }

    await this.prisma.submission.create({
      data: {
        userId,
        eventId,
        problemId: currentProblem.id,
        submittedAnswer,
        isCorrect,
        isFirstCorrect,
      },
    });

    const attemptCount = await this.prisma.submission.count({
      where: {
        userId,
        eventId,
        problemId: currentProblem.id,
      },
    });

    if (!isCorrect) {
      return {
        success: false,
        isCorrect: false,
        isFirstCorrect: false,
        attemptCount,
        message: `Incorrect, Attempt ${attemptCount}`,
      };
    }

    const nowMs = Date.now();
    const eventStartMs = event.startedAt ? new Date(event.startedAt).getTime() : null;
    const totalDurationSeconds = event.timeLimit * 60;
    const elapsedSeconds = eventStartMs
      ? Math.min(totalDurationSeconds, Math.max(0, Math.floor((nowMs - eventStartMs) / 1000)))
      : totalDurationSeconds;
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    const awardedPoints = Math.max(1, Math.ceil((remainingSeconds / Math.max(1, totalDurationSeconds)) * 100));

    const updatedParticipant = await this.prisma.participant.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        score: {
          increment: awardedPoints,
        },
        currentQuestion: {
          increment: 1,
        },
        lastSolvedAt: new Date(),
      },
      select: {
        currentQuestion: true,
      },
    });

    const nextProblem = await this.prisma.problem.findFirst({
      where: {
        eventId,
        orderIndex: updatedParticipant.currentQuestion,
      },
      select: { id: true },
    });

    return {
      success: true,
      isCorrect: true,
      isFirstCorrect,
      attemptCount,
      awardedPoints,
      message: nextProblem
        ? `Correct! +${awardedPoints} points. Moved to next problem.`
        : `Correct! +${awardedPoints} points. Event problems completed.`,
      nextQuestionIndex: updatedParticipant.currentQuestion,
      completed: !nextProblem,
    };
  }

  async getPersonalResults(eventId: string, userId: string, role: string) {
    if (role !== 'participant') {
      throw new ForbiddenException('Only participants can view personal submission history');
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        status: true,
        startedAt: true,
        timeLimit: true,
        name: true,
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
        userId: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException('Join the event before viewing personal results');
    }

    const problems = await this.prisma.problem.findMany({
      where: { eventId },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        orderIndex: true,
      },
    });

    const submissions = await this.prisma.submission.findMany({
      where: {
        eventId,
        userId,
      },
      orderBy: { submittedAt: 'asc' },
      select: {
        problemId: true,
        isCorrect: true,
        submittedAt: true,
      },
    });

    const firstCorrectByProblem = new Map<string, Date>();
    const attemptsByProblem = new Map<string, number>();

    for (const submission of submissions) {
      attemptsByProblem.set(
        submission.problemId,
        (attemptsByProblem.get(submission.problemId) ?? 0) + 1,
      );

      if (submission.isCorrect && !firstCorrectByProblem.has(submission.problemId)) {
        firstCorrectByProblem.set(submission.problemId, submission.submittedAt);
      }
    }

    const now = Date.now();
    const eventStartMs = event.startedAt ? new Date(event.startedAt).getTime() : null;
    const totalDurationSeconds = event.timeLimit * 60;
    const totalElapsedSeconds = eventStartMs
      ? Math.min(totalDurationSeconds, Math.max(0, Math.floor((now - eventStartMs) / 1000)))
      : 0;
    const timeRemainingSeconds = Math.max(0, totalDurationSeconds - totalElapsedSeconds);

    const eventEndMs = eventStartMs ? eventStartMs + totalDurationSeconds * 1000 : null;
    const effectiveNowMs = eventEndMs ? Math.min(now, eventEndMs) : null;

    let previousSolvedMs = eventStartMs;
    let canAccumulateTime = eventStartMs !== null;

    const history = problems.map((problem) => {
      const firstSolvedAt = firstCorrectByProblem.get(problem.id);
      const solvedAtMs = firstSolvedAt ? new Date(firstSolvedAt).getTime() : null;

      let timeSpentSeconds: number | null = null;
      let timeToSolveSeconds: number | null = null;

      if (canAccumulateTime && previousSolvedMs !== null) {
        if (solvedAtMs !== null) {
          timeSpentSeconds = Math.max(0, Math.floor((solvedAtMs - previousSolvedMs) / 1000));
          timeToSolveSeconds = timeSpentSeconds;
        } else if (effectiveNowMs !== null) {
          timeSpentSeconds = Math.max(0, Math.floor((effectiveNowMs - previousSolvedMs) / 1000));
          canAccumulateTime = false;
        }
      }

      if (solvedAtMs !== null) {
        previousSolvedMs = solvedAtMs;
      }

      return {
        problemId: problem.id,
        orderIndex: problem.orderIndex,
        title: problem.title,
        attempts: attemptsByProblem.get(problem.id) ?? 0,
        solved: solvedAtMs !== null,
        firstSolvedAt: firstSolvedAt ?? null,
        timeSpentSeconds,
        timeToSolveSeconds,
      };
    });

    const totalTimeSpentSeconds = history.reduce((total, item) => total + (item.timeSpentSeconds ?? 0), 0);

    return {
      eventId: event.id,
      eventName: event.name,
      status: event.status,
      startedAt: event.startedAt,
      totalTimeSpentSeconds,
      totalElapsedSeconds,
      timeRemainingSeconds,
      history,
    };
  }
}