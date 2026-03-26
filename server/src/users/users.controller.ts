import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterUserDto, UserResponseDto } from './dto/user.dto';
import { Auth } from '../auth/auth.decorator';
import type { AuthUser } from '../auth/auth.decorator';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current authenticated user role',
    description: 'Returns the authenticated user identity and backend-authoritative role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user resolved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
        email: { type: 'string', example: 'john@example.com' },
        role: { type: 'string', example: 'coordinator' },
      },
    },
  })
  me(@Auth() user: AuthUser): { id: string; email: string | null; displayName: string | null; role: string } {
    return {
      id: user.sub,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      role: user.role,
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Sync user registration',
    description:
      'Acknowledge user registration after Supabase signup. Backend can validate and create related records.',
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration payload',
  })
  async register(@Body() dto: RegisterUserDto): Promise<UserResponseDto> {
    return this.usersService.register(dto.userId, dto.email, dto.displayName);
  }

  @Get('resolve-identifier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve username or email to user info',
    description: 'Convert a username or email identifier to user information from Supabase.',
  })
  @ApiQuery({
    name: 'identifier',
    type: String,
    description: 'Username or email to resolve',
    example: 'john_doe or john@example.com',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'john@example.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async resolveIdentifier(@Query('identifier') identifier: string): Promise<{ email: string }> {
    const user = await this.usersService.resolveIdentifier(identifier);
    return { email: user.email };
  }
}
