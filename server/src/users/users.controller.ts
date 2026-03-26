import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterUserDto, UserResponseDto } from './dto/user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
    return this.usersService.register(dto.displayName, dto.phone, dto.email);
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
