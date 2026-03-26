import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional({ nullable: true })
  displayName?: string | null;

  @ApiProperty()
  score: number;

  @ApiProperty()
  solvedProblems: number;

  @ApiProperty()
  totalProblems: number;

  @ApiProperty()
  progressPercent: number;

  @ApiProperty()
  joinedAt: Date;
}
