/**
 * profiles.service.ts
 *
 * Logik Schicht für Nutzerprofile.
 * Verwaltet Profilabfragen, Follow und Unfollow Aktionen sowie
 * die Autor Suche und Subscription Übersicht. Delegiert alle
 * Datenbankzugriffe an das UserRepository.
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '../users/users.repository';

export interface ProfileResponseDto {
  profile: {
    username: string;
    bio: string;
    image: string;
    following: boolean;
  };
}

export interface MultipleProfilesResponseDto {
  profiles: ProfileResponseDto['profile'][];
}

@Injectable()
export class ProfilesService {
  constructor(private readonly usersRepository: UserRepository) { }

  /**
   * Mappt einen Nutzer Datensatz auf ein flaches Profil Objekt.
   *
   * @param user Nutzer Datensatz mit username, bio und profileImage
   * @param following Ob der aktuelle Nutzer diesem Profil folgt
   * @returns Flaches Profil Objekt gemäß `ProfileResponseDto['profile']`
   */
  private toProfile(
    user: { username: string; bio?: string | null; profileImage?: string | null },
    following: boolean,
  ): ProfileResponseDto['profile'] {
    return {
      username: user.username,
      bio: user.bio || '',
      image: user.profileImage || '',
      following,
    };
  }

  /**
   * Gibt das Profil eines Nutzers anhand seines Usernames zurück.
   *
   * @param username Username des gesuchten Nutzers
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Objekt mit `profile` des gefundenen Nutzers
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   */
  async getProfileByUsername(
    username: string,
    currentUserId?: number,
  ): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.getUserByUsername(username);

    if (!user) {
      throw new NotFoundException({ errors: { body: ['User not found'] } });
    }

    const following = currentUserId
      ? await this.usersRepository.isFollowing(currentUserId, user.id)
      : false;

    return { profile: this.toProfile(user, following) };
  }

  /**
   * Folgt einem Nutzer anhand seines Usernames.
   * Idempotent dank upsert. Mehrfaches Aufrufen hat keinen zusätzlichen Effekt.
   *
   * @param currentUserId ID des eingeloggten Nutzers
   * @param username Username des zu folgenden Nutzers
   * @returns Objekt mit dem aktualisierten `profile` (following: true)
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   * @throws BadRequestException wenn der Nutzer sich selbst folgen möchte
   */
  async followByUsername(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.usersRepository.getUserByUsername(username);

    if (!targetUser) {
      throw new NotFoundException({ errors: { body: ['User not found'] } });
    }

    if (targetUser.id === currentUserId) {
      throw new BadRequestException({
        errors: { body: ['You cannot follow yourself'] },
      });
    }

    await this.usersRepository.subscribeToAuthor(currentUserId, targetUser.id);

    return { profile: this.toProfile(targetUser, true) };
  }

  /**
   * Entfolgt einem Nutzer anhand seines Usernames.
   * Idempotent, wenn kein Abonnement existiert, passiert nichts.
   *
   * @param currentUserId ID des eingeloggten Nutzers
   * @param username Username des zu entfolgenden Nutzers
   * @returns Objekt mit dem aktualisierten `profile` (following: false)
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   */
  async unfollowByUsername(
    currentUserId: number,
    username: string,
  ): Promise<ProfileResponseDto> {
    const targetUser = await this.usersRepository.getUserByUsername(username);

    if (!targetUser) {
      throw new NotFoundException({ errors: { body: ['User not found'] } });
    }

    await this.usersRepository.unsubscribeFromAuthor(
      currentUserId,
      targetUser.id,
    );

    return { profile: this.toProfile(targetUser, false) };
  }

  // Custom Extensions

  /**
   * Durchsucht Nutzer nach Username oder E-Mail (Teilstring Suche).
   * Begrenzt die Ergebnismenge auf maximal 25 Einträge.
   *
   * @param query Suchbegriff (leerer String gibt keine Ergebnisse zurück)
   * @param limit Gewünschte Anzahl an Ergebnissen (wird auf 1–25 geclippt, Standard 10)
   * @returns Objekt mit `profiles` Array der gefundenen Nutzer
   */
  async searchAuthors(
    query: string,
    limit = 10,
  ): Promise<MultipleProfilesResponseDto> {
    const safeLimit = Number.isFinite(limit)
      ? Math.min(Math.max(Math.trunc(limit), 1), 25)
      : 10;
    const searchTerm = query.trim();

    const users = await this.usersRepository.searchUsers(searchTerm, safeLimit);

    return {
      profiles: users.map((user: any) => this.toProfile(user, false)),
    };
  }

  /**
   * Gibt alle Autoren zurück, denen der eingeloggte Nutzer folgt.
   *
   * @param userId ID des eingeloggten Nutzers
   * @returns Objekt mit `profiles` Array der abonnierten Autoren (following: true)
   */
  async getSubscriptions(
    userId: number,
  ): Promise<MultipleProfilesResponseDto> {
    const users = await this.usersRepository.getSubscriptions(userId);

    return {
      profiles: users.map((user: any) => this.toProfile(user, true)),
    };
  }
}
