import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
