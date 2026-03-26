import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProblemResponseDto {
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