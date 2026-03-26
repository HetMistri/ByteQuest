import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProblemDto {
  @ApiProperty({ example: 'Maze Escape' })
  title: string;

  @ApiProperty({ example: 'Find the shortest path through the maze to reach the exit.' })
  description: string;

  @ApiProperty({ example: 'RDDRUR' })
  solution: string;

  @ApiPropertyOptional({ example: 'https://your-supabase-bucket-url/problem-assets/event-1/maze.png' })
  downloadableContentUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  orderIndex?: number;
}