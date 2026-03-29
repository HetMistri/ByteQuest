import { Module } from '@nestjs/common';
import { ProblemService } from './problem.service';
import { SupabaseModule } from '../supabase/supabase.module'; // 👈 ADD THIS
import { PrismaModule } from '../prisma/prisma.module'; // 👈 assuming you have this

@Module({
  imports: [SupabaseModule, PrismaModule], // 👈 THIS LINE FIXES YOUR ERROR
  providers: [ProblemService],
  exports: [ProblemService],
})
export class ProblemModule {}