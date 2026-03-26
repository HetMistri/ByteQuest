import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Supabase user id',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId?: string;

  @ApiProperty({
    description: 'Email address for fallback user resolution',
    example: 'john@example.com',
    format: 'email',
  })
  email?: string;

  @ApiProperty({
    description: 'Preferred display name',
    example: 'ByteMaster77',
    required: false,
  })
  displayName?: string;
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
    description: 'Assigned role for authorization',
    example: 'participant',
  })
  role: string;

  @ApiProperty({
    description: 'Display name for UI presentation',
    example: 'ByteMaster77',
    nullable: true,
    required: false,
  })
  displayName?: string | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-03-26T11:15:08.000Z',
  })
  created_at: Date;
}
