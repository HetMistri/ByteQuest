import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    const payload = await this.supabaseService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const dbUser = await this.usersService.findById(payload.sub);

    if (!dbUser) {
      throw new UnauthorizedException('User role could not be resolved');
    }

    request.user = {
      id: payload.sub,
      sub: payload.sub,
      email: payload.email,
      role: dbUser.role,
    };

    return true;
  }

  private extractToken(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer') {
      return undefined;
    }

    return token;
  }
}
