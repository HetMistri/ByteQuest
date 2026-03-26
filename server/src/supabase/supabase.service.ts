import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private adminClient: SupabaseClient | null = null;
  private authClient: SupabaseClient | null = null;
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabaseUrl = process.env.SUPABASE_URL;
  private readonly supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  private readonly supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  private hasWarnedMissingTokenVerifyConfig = false;

  constructor() {
    const supabaseUrl = this.supabaseUrl;
    const supabaseAnonKey = this.supabaseAnonKey;
    const supabaseServiceKey = this.supabaseServiceKey;

    if (!supabaseUrl) {
      this.logger.warn('SUPABASE_URL not set - Supabase service disabled');
      return;
    }

    if (supabaseAnonKey) {
      this.authClient = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      this.logger.warn('SUPABASE_ANON_KEY not set - token verification disabled');
    }

    if (!supabaseServiceKey) {
      this.logger.warn('SUPABASE_SERVICE_KEY not set - Supabase admin operations disabled');
    } else {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
    }

    this.logger.log('Supabase service initialized');
  }

  getClient(): SupabaseClient | null {
    return this.adminClient;
  }

  isEnabled(): boolean {
    return this.adminClient !== null;
  }

  async getUserByUsername(username: string) {
    if (!this.adminClient) return null;

    try {
      const { data, error } = await this.adminClient.auth.admin.listUsers();

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
    if (!this.adminClient) return null;

    try {
      const { data: users, error } = await this.adminClient.auth.admin.listUsers();

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
    if (!this.adminClient) return null;

    try {
      const { data: users, error } = await this.adminClient.auth.admin.listUsers();

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
    if (!this.authClient) {
      if (!this.hasWarnedMissingTokenVerifyConfig) {
        this.logger.warn('Cannot verify token: SUPABASE_URL or SUPABASE_ANON_KEY not set');
        this.hasWarnedMissingTokenVerifyConfig = true;
      }
      return null;
    }

    try {
      const { data, error } = await this.authClient.auth.getUser(token);

      if (error || !data.user) {
        return null;
      }

      return {
        sub: data.user.id,
        email: data.user.email,
      };
    } catch (error) {
      this.logger.error(`Token verification failed: ${error}`);
      return null;
    }
  }
}
