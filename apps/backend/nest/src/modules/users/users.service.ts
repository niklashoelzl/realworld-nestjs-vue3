/**
 * users.service.ts
 *
 * Logik Schicht für Nutzer.
 * Verwaltet Profilabfragen, Profilaktualisierungen, Profilbild Upload
 * und Passwortänderungen. Stellt bei Erfolg stets einen frisch signierten
 * JWT Token aus und delegiert Datenbankzugriffe an das UserRepository.
 */

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from './users.repository';
import * as bcrypt from 'bcrypt';

export interface UserResponseDto {
  user: {
    email: string;
    token: string;
    username: string;
    bio: string;
    image: string;
  };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Erstellt ein `UserResponseDto` mit einem frisch signierten JWT Token.
   * Wird intern von allen Methoden verwendet, die ein User Objekt zurückgeben.
   *
   * @param user Nutzer Datensatz mit id, email, username, bio und profileImage
   * @returns Vollständiges `UserResponseDto` mit aktuellem Token
   */
  private async buildUserResponse(user: {
    id: number;
    email: string;
    username: string;
    bio?: string | null;
    profileImage?: string | null;
  }): Promise<UserResponseDto> {
    const payload = { sub: user.id, email: user.email };
    const token = await this.jwtService.signAsync(payload);

    return {
      user: {
        email: user.email,
        token,
        username: user.username,
        bio: user.bio || '',
        image: user.profileImage || '',
      },
    };
  }

  /**
   * Gibt das Profil des eingeloggten Nutzers zurück.
   *
   * @param userId ID des eingeloggten Nutzers
   * @returns `UserResponseDto` mit aktuellem Token
   * @throws UnauthorizedException wenn kein Nutzer mit der ID gefunden wurde
   */
  async getProfile(userId: number): Promise<UserResponseDto> {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new UnauthorizedException({ errors: { body: ['User not found'] } });
    }

    return this.buildUserResponse(user);
  }

  /**
   * Aktualisiert das Profil des eingeloggten Nutzers.
   * Prüft ob eine neue E-Mail bereits von einem anderen Nutzer verwendet wird.
   *
   * @param userId ID des eingeloggten Nutzers
   * @param updateData Zu ändernde Felder (username, email, bio alle optional)
   * @returns Aktualisiertes `UserResponseDto` mit frisch signiertem Token
   * @throws BadRequestException wenn die E-Mail bereits vergeben ist oder das Update fehlschlägt
   */
  async updateProfile(
    userId: number,
    updateData: { username?: string; email?: string; bio?: string },
  ): Promise<UserResponseDto> {
    if (updateData.email) {
      const existingUser = await this.userRepository.getUserByEmail(
        updateData.email,
      );

      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException({
          errors: { body: ['Email already in use'] },
        });
      }
    }

    const updatedUser = await this.userRepository.updateUser(
      userId,
      updateData,
    );

    if (!updatedUser) {
      throw new BadRequestException({
        errors: { body: ['Could not update profile'] },
      });
    }

    return this.buildUserResponse(updatedUser);
  }

  /**
   * Speichert ein neues Profilbild als Base64 Data URL.
   * Prüft Dateigröße (max 2 MB) und Format (muss mit `data:image/` beginnen).
   *
   * @param userId ID des eingeloggten Nutzers
   * @param imageData Base64 kodierte Data URL des Bilds
   * @returns Aktualisiertes `UserResponseDto` mit frisch signiertem Token
   * @throws BadRequestException wenn das Bild zu groß, das Format ungültig oder das Update fehlschlägt
   */
  async uploadProfileImage(
    userId: number,
    imageData: string,
  ): Promise<UserResponseDto> {
    if (imageData.length > 2000000) {
      throw new BadRequestException({
        errors: { body: ['Image too large (max 2MB)'] },
      });
    }

    if (!imageData.startsWith('data:image/')) {
      throw new BadRequestException({
        errors: { body: ['Invalid image format. Must be base64 data URL'] },
      });
    }

    const updatedUser = await this.userRepository.updateUserProfileImage(
      userId,
      imageData,
    );

    if (!updatedUser) {
      throw new BadRequestException({
        errors: { body: ['Could not update profile image'] },
      });
    }

    return this.buildUserResponse(updatedUser);
  }

  /**
   * Ändert das Passwort des eingeloggten Nutzers.
   * Verifiziert das aktuelle Passwort per bcrypt und prüft die Mindestlänge
   * des neuen Passworts (mindestens 8 Zeichen).
   *
   * @param userId ID des eingeloggten Nutzers
   * @param currentPassword Aktuelles Klartextpasswort zur Verifikation
   * @param newPassword Neues Klartextpasswort
   * @throws BadRequestException wenn der Nutzer nicht gefunden wurde, das aktuelle Passwort falsch oder das neue zu kurz ist
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.getUserById(userId);
    if (!user)
      throw new BadRequestException({ errors: { body: ['User not found'] } });

    const fullUser = await this.userRepository.getUserByEmail(user.email);
    const isValid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!isValid)
      throw new BadRequestException({
        errors: { body: ['Aktuelles Passwort ist falsch'] },
      });

    if (newPassword.length < 8) {
      throw new BadRequestException({
        errors: { body: ['Passwort muss mindestens 8 Zeichen lang sein'] },
      });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateUser(userId, { password_hash });
  }
}
