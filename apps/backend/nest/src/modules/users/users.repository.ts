/**
 * users.repository.ts
 *
 * Datenbankzugriffsschicht für Nutzer und Subscriptions.
 * Kapselt alle Prisma Abfragen rund um das User und Subscription Modell.
 * Rohdaten werden per `mapUser` in das interne `User` Interface überführt.
 */

import { Injectable } from '@nestjs/common';
import { DBService } from '@common/database';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  bio?: string;
  profileImage?: string;
  created_at?: string;
}

@Injectable()
export class UserRepository {
  constructor(private readonly db: DBService) { }

  /**
   * Gibt den Prisma Client zurück.
   */
  private get prisma() {
    return this.db.client;
  }

  /**
   * Wandelt einen rohen Prisma Nutzer Datensatz in das interne `User` Interface um.
   * Vereinheitlicht dabei unterschiedliche Feldnamen (z. B. passwordHash vs. password_hash).
   *
   * @param user Roher Prisma Nutzer Datensatz
   * @returns Gemapptes `User` Objekt
   */
  private mapUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      password_hash: user.password_hash ?? user.passwordHash,
      bio: user.bio ?? undefined,
      profileImage: user.profileImage ?? user.profile_image ?? undefined,
      created_at: user.createdAt ? user.createdAt.toISOString() : undefined,
    };
  }

  /**
   * Sucht einen Nutzer anhand seiner E-Mail Adresse.
   *
   * @param email E-Mail Adresse des gesuchten Nutzers
   * @returns Den gefundenen Nutzer oder `null`
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user;
    } catch (err) {
      return null;
    }
  }

  /**
   * Legt einen neuen Nutzer in der Datenbank an.
   *
   * @param data Nutzerdaten mit email, username und password_hash
   * @returns Der erstellte rohe Prisma Nutzer Datensatz
   */
  async createUser(data: {
    email: string;
    username: string;
    password_hash: string;
  }): Promise<any> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * Sucht einen Nutzer anhand seiner ID.
   *
   * @param userId Primärschlüssel des gesuchten Nutzers
   * @returns Das gemappte `User` Objekt oder `null`
   */
  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) return null;

      return this.mapUser(user);
    } catch {
      return null;
    }
  }

  /**
   * Aktualisiert das Profilbild eines Nutzers.
   *
   * @param userId Primärschlüssel des Nutzers
   * @param profileImage Base64 Data URL des neuen Profilbilds
   * @returns Das aktualisierte gemappte `User` Objekt oder `null`
   */
  async updateUserProfileImage(
    userId: number,
    profileImage: string,
  ): Promise<User | null> {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { profileImage },
      });

      return this.mapUser(user);
    } catch (err) {
      return null;
    }
  }

  /**
   * Durchsucht Nutzer nach Username oder E-Mail (Teilstring Suche).
   * Gibt ein leeres Array zurück wenn der Suchbegriff leer ist.
   *
   * @param query Suchbegriff
   * @param limit Maximale Anzahl an Ergebnissen (Standard 10)
   * @returns Array von Nutzer Objekten mit id, email, username, bio und profileImage
   */
  async searchUsers(query: string, limit = 10): Promise<any[]> {
    const searchTerm = query.trim();

    if (!searchTerm) return [];

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm } },
          { email: { contains: searchTerm } },
        ],
      },
      orderBy: { username: 'asc' },
      take: limit,
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio ?? undefined,
      profileImage: user.profileImage ?? undefined,
    }));
  }

  /**
   * Gibt alle Autoren zurück, denen ein Nutzer folgt.
   * Erhält die Reihenfolge der Subscriptions durch manuelles Sortieren nach authorId.
   *
   * @param userId ID des Nutzers dessen Subscriptions abgefragt werden
   * @returns Array von Nutzer Objekten der abonnierten Autoren
   */
  async getSubscriptions(userId: number): Promise<any[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { subscriberId: userId },
      orderBy: { authorId: 'asc' },
    });

    if (subscriptions.length === 0) return [];

    const authorIds = subscriptions.map((s) => s.authorId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: authorIds } },
    });

    const byId = new Map(users.map((u) => [u.id, u]));

    return authorIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((user: any) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        bio: user.bio ?? undefined,
        profileImage: user.profileImage ?? undefined,
      }));
  }

  /**
   * Abonniert einen Autor.
   * Idempotent dank upsert. Mehrfaches Aufrufen hat keinen zusätzlichen Effekt.
   *
   * @param userId ID des Abonnenten
   * @param authorId ID des zu abonnierenden Autors
   */
  async subscribeToAuthor(userId: number, authorId: number): Promise<void> {
    try {
      await this.prisma.subscription.upsert({
        where: {
          subscriberId_authorId: {
            subscriberId: userId,
            authorId,
          },
        },
        update: {},
        create: {
          subscriberId: userId,
          authorId,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Kündigt die Subscription eines Autors.
   * Idempotent, wenn keine Subscription existiert (P2025), passiert nichts.
   *
   * @param userId ID des Abonnenten
   * @param authorId ID des zu entfolgenden Autors
   * @throws Wirft alle anderen Prisma Fehler weiter
   */
  async unsubscribeFromAuthor(userId: number, authorId: number): Promise<void> {
    try {
      await this.prisma.subscription.delete({
        where: {
          subscriberId_authorId: {
            subscriberId: userId,
            authorId,
          },
        },
      });
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        return;
      }
      throw err;
    }
  }

  /**
   * Aktualisiert die Profildaten eines Nutzers.
   * Ignoriert leere Strings bei username und email.
   * Gibt den unveränderten Nutzer zurück wenn keine Felder übergeben wurden.
   *
   * @param userId Primärschlüssel des zu aktualisierenden Nutzers
   * @param updateData Zu ändernde Felder (alle optional)
   * @returns Das aktualisierte gemappte `User` Objekt oder `null`
   */
  async updateUser(
    userId: number,
    updateData: {
      username?: string;
      email?: string;
      bio?: string;
      profileImage?: string;
      password_hash?: string;
    },
  ): Promise<any | null> {
    try {
      const dataToUpdate: any = {};

      if (updateData.username?.trim()) {
        dataToUpdate.username = updateData.username;
      }

      if (updateData.email?.trim()) {
        dataToUpdate.email = updateData.email;
      }

      if (updateData.bio !== undefined) {
        dataToUpdate.bio = updateData.bio;
      }

      if (updateData.profileImage !== undefined) {
        dataToUpdate.profileImage = updateData.profileImage;
      }

      if (updateData.password_hash !== undefined)
        dataToUpdate.password_hash = updateData.password_hash;

      if (Object.keys(dataToUpdate).length === 0) {
        return this.getUserById(userId);
      }

      const user = await this.prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
      });

      return this.mapUser(user);
    } catch (err) {
      throw err;
    }
  }

  /**
   * Sucht einen Nutzer anhand seines Usernames.
   *
   * @param username Username des gesuchten Nutzers
   * @returns Das gemappte `User` Objekt oder `null`
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      if (!user) return null;

      return this.mapUser(user);
    } catch {
      return null;
    }
  }

  /**
   * Prüft ob ein Nutzer einem anderen Nutzer folgt.
   *
   * @param followerId ID des potenziellen Abonnenten
   * @param followedId ID des potenziell abonnierten Nutzers
   * @returns `true` wenn ein Abonnement existiert, sonst `false`
   */
  async isFollowing(followerId: number, followedId: number): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {
        subscriberId_authorId: {
          subscriberId: followerId,
          authorId: followedId,
        },
      },
    });

    return subscription !== null;
  }
}
