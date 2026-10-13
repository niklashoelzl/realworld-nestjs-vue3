/**
 * auth.modules.ts
 *
 * NestJS Modul für die Authentifizierung.
 * Konfiguriert JWT und Passport, registriert alle Auth relevanten
 * Guards, Strategies und Services und exportiert sie für andere Module.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import 'dotenv/config';
import { JwtGuard } from './jwt.guard';
import { UserRepository } from '../users/users.repository';
import { OptionalJwtGuard } from './OptionalJwt.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-env',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtGuard,
    OptionalJwtGuard,
    UserRepository,
  ],
  exports: [AuthService, JwtModule, PassportModule, JwtGuard, OptionalJwtGuard],
})
export class AuthModule { }
