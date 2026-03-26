import { ApiPropertyOptional } from '@nestjs/swagger';

export class JoinEventDto {
  @ApiPropertyOptional({ example: 'optional-secret' })
  password?: string;
}
