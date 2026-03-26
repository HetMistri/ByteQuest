import { ApiProperty } from '@nestjs/swagger';

export class ParticipantResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  displayName?: string | null;

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
