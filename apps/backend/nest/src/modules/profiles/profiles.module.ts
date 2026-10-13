/**
 * profiles.module.ts
 *
 * NestJS Modul für den Profilbereich.
 * Importiert das AuthModule für die JWT Authentifizierung sowie das
 * UsersModule, um über das UserRepository auf Nutzerdaten zuzugreifen.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.modules';
import { UsersModule } from '../users/users.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule { }
