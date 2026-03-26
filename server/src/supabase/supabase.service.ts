import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl) {
      this.logger.warn('SUPABASE_URL not set - Supabase service disabled');
      return;
    }

    if (!supabaseServiceKey) {
      this.logger.warn('SUPABASE_SERVICE_KEY not set - Supabase admin operations disabled');
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.logger.log('Supabase service initialized');
  }

  getClient(): SupabaseClient | null {
    return this.supabase;
  }

  isEnabled(): boolean {
    return this.supabase !== null;
  }

  async getUserByUsername(username: string) {
    if (!this.supabase) return null;

    try {
      const { data, error } = await this.supabase.auth.admin.listUsers();

      if (error) {
        return null;
      }

      const user = data.users.find(
        (u) => u.user_metadata?.username?.toLowerCase() === username.toLowerCase(),
      );

      return user || null;
    } catch (error) {
      this.logger.error(`Error fetching user by username: ${error}`);
      return null;
    }
  }

  async getUserByEmail(email: string) {
    if (!this.supabase) return null;

    try {
      const { data: users, error } = await this.supabase.auth.admin.listUsers();

      if (error) {
        return null;
      }

      const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      return user || null;
    } catch (error) {
      this.logger.error(`Error fetching user by email: ${error}`);
      return null;
    }
  }

  async getUserByIdentifier(identifier: string) {
    if (!this.supabase) return null;

    try {
      const { data: users, error } = await this.supabase.auth.admin.listUsers();

      if (error) {
        return null;
      }

      const normalizedIdentifier = identifier.toLowerCase();

      return (
        users.users.find((u) => u.user_metadata?.username?.toLowerCase() === normalizedIdentifier) ||
        users.users.find((u) => u.email?.toLowerCase() === normalizedIdentifier) ||
        null
      );
    } catch (error) {
      this.logger.error(`Error fetching user by identifier: ${error}`);
      return null;
    }
  }

  async verifyToken(token: string): Promise<{ sub: string; email?: string } | null> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      this.logger.warn('Cannot verify token: SUPABASE_URL or SUPABASE_ANON_KEY not set');
      return null;
    }

    try {
      const secret = new TextEncoder().encode(supabaseAnonKey.split('.')[1]);
      const verified = await jwtVerify(token, secret);
      return {
        sub: verified.payload.sub as string,
        email: verified.payload.email as string | undefined,
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error}`);
      return null;
    }
  }
}
