import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProblemDto {
  @ApiPropertyOptional({ example: 'Updated Maze Escape' })
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description text' })
  description?: string;

  @ApiPropertyOptional({ example: 'RDDRUR' })
  solution?: string;

  @ApiPropertyOptional({ example: 'https://your-supabase-bucket-url/problem-assets/event-1/maze.png' })
  downloadableContentUrl?: string;

  @ApiPropertyOptional({ example: 2 })
  orderIndex?: number;
}