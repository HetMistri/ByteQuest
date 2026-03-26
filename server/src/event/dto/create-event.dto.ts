import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'ByteQuest Weekly #1' })
  name: string;

  @ApiProperty({ example: 60, description: 'Event time limit in minutes' })
  timeLimit: number;

  @ApiPropertyOptional({ example: 'optional-secret' })
  password?: string;
}
