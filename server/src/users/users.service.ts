import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async register(displayName: string, phone: string, email: string): Promise<UserResponseDto> {
    if (!displayName.trim() || !phone.trim()) {
      throw new BadRequestException('Display name and phone are required');
    }

    return {
      id: email,
      display_name: displayName,
      email,
      created_at: new Date(),
    };
  }

  async resolveIdentifier(identifier: string): Promise<UserResponseDto> {
    const user = await this.supabaseService.getUserByIdentifier(identifier);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      display_name: (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'Player',
      email: user.email || '',
      created_at: new Date(user.created_at || new Date()),
    };
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    const client = this.supabaseService.getClient();

    if (!client) {
      return null;
    }

    const { data, error } = await client.auth.admin.getUserById(id);

    if (error || !data.user) {
      return null;
    }

    const user = data.user;

    return {
      id: user.id,
      display_name: (user.user_metadata?.display_name as string | undefined) || user.email?.split('@')[0] || 'Player',
      email: user.email || '',
      created_at: new Date(user.created_at || new Date()),
    };
  }
}
