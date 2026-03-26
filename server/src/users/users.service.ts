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

  async register(userId?: string, email?: string, displayName?: string): Promise<UserResponseDto> {
    let resolvedUserId = userId?.trim();
    let resolvedDisplayName = displayName?.trim() || undefined;

    if (!resolvedUserId && email?.trim()) {
      const supabaseUser = await this.supabaseService.getUserByEmail(email);
      resolvedUserId = supabaseUser?.id;
      if (!resolvedDisplayName) {
        resolvedDisplayName =
          (supabaseUser?.user_metadata?.display_name as string | undefined)?.trim() ||
          (supabaseUser?.user_metadata?.name as string | undefined)?.trim() ||
          (supabaseUser?.user_metadata?.full_name as string | undefined)?.trim() ||
          undefined;
      }
    }

    if (!resolvedUserId) {
      throw new BadRequestException('Supabase user id is required for registration');
    }

    let user = await this.usersRepository.findOne({ where: { id: resolvedUserId } });

    if (!user) {
      user = this.usersRepository.create({
        id: resolvedUserId,
        role: 'participant',
        displayName: resolvedDisplayName ?? null,
      });

      user = await this.usersRepository.save(user);
    } else if (resolvedDisplayName && user.displayName !== resolvedDisplayName) {
      user.displayName = resolvedDisplayName;
      user = await this.usersRepository.save(user);
    }

    return {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
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

  async findById(id: string, displayName?: string): Promise<User | null> {
    const normalizedDisplayName = displayName?.trim() || undefined;
    const user = await this.usersRepository.findOne({ where: { id } });

    if (user) {
      if (normalizedDisplayName && user.displayName !== normalizedDisplayName) {
        user.displayName = normalizedDisplayName;
        return this.usersRepository.save(user);
      }

      return user;
    }

    const created = this.usersRepository.create({
      id,
      role: 'participant',
      displayName: normalizedDisplayName ?? null,
    });

    return this.usersRepository.save(created);
  }
}
