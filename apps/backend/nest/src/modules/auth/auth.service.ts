/**
 * auth.service.ts
 *
 * Logik Schicht für die Authentifizierung.
 * Verwaltet Registrierung und Login von Nutzern, prüft Credentials
 * per bcrypt und stellt JWT Tokens aus.
 */

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { RegisterDto, LoginDto } from '@common/model';
import { RegisterDtoSchema, LoginDtoSchema } from '@common/model';
import { UserRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UserRepository,
    private jwtService: JwtService,
  ) { }

  /**
   * Registriert einen neuen Nutzer.
   * Prüft ob die E-Mail bereits vergeben ist, hasht das Passwort
   * und gibt einen signierten JWT Token zurück.
   *
   * @param dto Validierte Registrierungsdaten (email, username, password)
   * @returns User Objekt mit email, username, token, bio und image
   * @throws BadRequestException wenn die E-Mail bereits registriert ist
   */
  async register(dto: RegisterDto): Promise<{ user: { email: string; username: string; token: string; bio: string; image: string } }> {
    RegisterDtoSchema.parse(dto);
    const existingUser = await this.usersRepository.getUserByEmail(dto.email);
    if (existingUser)
      throw new BadRequestException({ errors: { body: ['Email already registered'] } });
    const password_hash = await bcrypt.hash(dto.password, 10);
    const created = await this.usersRepository.createUser({
      email: dto.email,
      username: dto.username,
      password_hash,
    });
    const token = await this.jwtService.signAsync({ sub: created.id, email: created.email });
    return {
      user: {
        email: created.email,
        username: created.username,
        token,
        bio: '',
        image: '',
      },
    };
  }

  /**
   * Meldet einen bestehenden Nutzer an.
   * Prüft E-Mail und Passwort und gibt bei Erfolg einen signierten JWT Token zurück.
   *
   * @param dto Validierte Login Daten (email, password)
   * @returns User Objekt mit email, username, token, bio und image
   * @throws UnauthorizedException wenn E-Mail oder Passwort ungültig sind
   */
  async login(dto: LoginDto): Promise<{ user: { email: string; username: string; token: string; bio: string; image: string } }> {
    LoginDtoSchema.parse(dto);
    const user = await this.usersRepository.getUserByEmail(dto.email);
    if (!user)
      throw new UnauthorizedException({ errors: { body: ['Invalid credentials'] } });
    const isValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isValid)
      throw new UnauthorizedException({ errors: { body: ['Invalid credentials'] } });
    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return {
      user: {
        email: user.email,
        username: user.username,
        token,
        bio: user.bio || '',
        image: user.profileImage || '',
      },
    };
  }
}
