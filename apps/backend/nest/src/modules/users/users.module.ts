/**
 * users.module.ts
 *
 * NestJS Modul für den Nutzerbereich.
 * Importiert das AuthModule für JWT und stellt UserRepository sowie
 * UsersService für andere Module (z. B. ProfilesModule) bereit.
 */

import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserRepository } from './users.repository';
import { AuthModule } from '../auth/auth.modules';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService, UserRepository],
  exports: [UserRepository, UsersService],
})
export class UsersModule { }
