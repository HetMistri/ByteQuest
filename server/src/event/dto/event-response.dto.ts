import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class EventProblemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional()
  resourceFile?: string | null;

  @ApiProperty()
  orderIndex: number;

  @ApiProperty()
  createdAt: Date;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['scheduled', 'running', 'paused', 'ended'] })
  status: 'scheduled' | 'running' | 'paused' | 'ended';

  @ApiProperty()
  timeLimit: number;

  @ApiProperty()
  createdBy: string;

  @ApiPropertyOptional()
  startedAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  totalProblems?: number;

  @ApiPropertyOptional()
  currentQuestionIndex?: number;

  @ApiPropertyOptional()
  totalDurationSeconds?: number;

  @ApiPropertyOptional()
  totalElapsedSeconds?: number;

  @ApiPropertyOptional()
  timeRemainingSeconds?: number;

  @ApiPropertyOptional()
  problemTimeSpentSeconds?: number;

  @ApiPropertyOptional()
  userTotalTimeSpentSeconds?: number;

  @ApiPropertyOptional()
  progressPercent?: number;

  @ApiPropertyOptional({ type: () => EventProblemDto })
  currentProblem?: EventProblemDto | null;
}
