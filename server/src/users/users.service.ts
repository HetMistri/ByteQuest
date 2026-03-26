import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { UserResponseDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly supabaseService: SupabaseService,
  ) {}

  async register(userId?: string, email?: string): Promise<UserResponseDto> {
    let resolvedUserId = userId?.trim();

    if (!resolvedUserId && email?.trim()) {
      const supabaseUser = await this.supabaseService.getUserByEmail(email);
      resolvedUserId = supabaseUser?.id;
    }

    if (!resolvedUserId) {
      throw new BadRequestException('Supabase user id is required for registration');
    }

    let user = await this.usersRepository.findOne({ where: { id: resolvedUserId } });

    if (!user) {
      user = this.usersRepository.create({
        id: resolvedUserId,
        role: 'participant',
      });

      user = await this.usersRepository.save(user);
    }

    return {
      id: user.id,
      role: user.role,
      created_at: user.created_at,
    };
  }

  async resolveIdentifier(identifier: string): Promise<{ email: string }> {
    const user = await this.supabaseService.getUserByIdentifier(identifier);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      email: user.email || '',
    };
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (user) {
      return user;
    }

    const created = this.usersRepository.create({
      id,
      role: 'participant',
    });

    return this.usersRepository.save(created);
  }
}
