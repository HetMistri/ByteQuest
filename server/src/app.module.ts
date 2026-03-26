import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { PrismaModule } from './prisma/prisma.module';
import { EventModule } from './event/event.module';
import { ProblemModule } from './problem/problem.module';
import { SubmissionModule } from './submission/submission.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/bytequest.db',
      entities: [User],
      synchronize: true,
      logging: true,
    }),
    SupabaseModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    EventModule,
    ProblemModule,
    SubmissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
