import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Display name shown in leaderboard, game and profile',
    example: 'John Doe',
    minLength: 3,
    maxLength: 255,
  })
  displayName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+919999999999',
  })
  phone: string;

  @ApiProperty({
    description: 'Email address for the account',
    example: 'john@example.com',
    format: 'email',
  })
  email: string;
}

export class ResolveIdentifierDto {
  @ApiProperty({
    description: 'Username or email to resolve',
    example: 'john_doe',
  })
  identifier: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  display_name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-03-26T11:15:08.000Z',
  })
  created_at: Date;
}
