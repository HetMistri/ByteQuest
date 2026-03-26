import { ApiProperty } from '@nestjs/swagger';

export class ParticipantResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty()
  currentQuestion: number;

  @ApiProperty()
  score: number;

  @ApiProperty()
  flags: number;

  @ApiProperty()
  joinedAt: Date;
}
