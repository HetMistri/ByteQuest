import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [SupabaseModule, UsersModule],
  providers: [AuthGuard, RolesGuard],
  exports: [AuthGuard, RolesGuard, SupabaseModule, UsersModule],
})
export class AuthModule {}
