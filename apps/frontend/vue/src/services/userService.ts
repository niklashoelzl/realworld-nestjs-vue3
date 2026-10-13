/**
 * src/services/userService.ts
 *
 * Service für alle nutzer und profilbezogenen API Aufrufe.
 * Kapselt die Kommunikation mit den Backend Endpunkten `/user` und `/profiles`.
 * Das JWT Token wird automatisch aus dem `authStore` bezogen.
 */

import { useAuthStore } from '@/stores/authStore';

/** Nutzerprofil des eingeloggten Nutzers aus `GET /user` */
export interface User {
  username: string;
  email: string;
  bio?: string;
  image?: string;
  createdAt?: string;
}

/** Öffentliches Profil eines beliebigen Nutzers aus `GET /profiles/:username` */
export interface Profile {
  username: string;
  bio?: string;
  image?: string;
  following: boolean;
}

/** Felder, die beim Aktualisieren des eigenen Profils übermittelt werden können */
export interface UpdateProfileDto {
  username?: string;
  bio?: string;
  email?: string;
}

class UserService {
  private apiUrl = import.meta.env.VITE_API_URL;
  private baseUrl = `${this.apiUrl}/profiles`;

  /**
   * Liest den Response Body sicher als JSON aus.
   * Gibt ein leeres Objekt zurück wenn der Body leer ist,
   * und `{ message: text }` bei ungültigem JSON.
   *
   * @param response Der HTTP Response
   */
  private async parseJsonSafe(response: Response): Promise<any> {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  /**
   * Gibt das Profil des eingeloggten Nutzers zurück.
   * Auth erforderlich.
   * GET /user
   */
  async getProfile(): Promise<User> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.apiUrl}/user`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await this.parseJsonSafe(response);
      throw new Error(error.message || 'Failed to fetch profile');
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Aktualisiert das Profil des eingeloggten Nutzers.
   * Felder mit dem Wert `undefined` oder leerem String werden nicht übermittelt.
   * Auth erforderlich.
   * PUT /user, Body: { user: UpdateProfileDto }
   *
   * @param data Zu ändernde Profilfelder
   */
  async updateProfile(data: UpdateProfileDto): Promise<User> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => {
        return value !== undefined && value !== '';
      }),
    );

    const response = await fetch(`${this.apiUrl}/user`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: filteredData }),
    });

    if (!response.ok) {
      const error = await this.parseJsonSafe(response);
      throw new Error(error.message || 'Failed to update profile');
    }

    const result = await response.json();
    return result.user;
  }

  /**
   * Lädt ein Profilbild hoch.
   * Die Datei wird client seitig als Base64 Data URL kodiert und
   * als JSON Body an den Server übermittelt.
   * Auth erforderlich.
   * POST /users/profile-image
   *
   * @param file Das hochzuladende Bild (max. 5 MB, Typvalidierung obliegt dem Aufrufer)
   */
  async uploadProfileImage(file: File): Promise<User> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;

          const response = await fetch(`${this.apiUrl}/users/profile-image`, {
            method: 'POST',
            headers: {
              Authorization: `Token ${authStore.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData: base64Data }),
          });

          if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to upload image');
          }

          const result = await response.json();
          resolve(result.user);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Sucht nach Nutzerprofilen anhand eines Suchbegriffs.
   * Auth erforderlich.
   * GET /profiles/search?q=query&limit=10
   *
   * @param query Suchbegriff
   * @param limit Maximale Anzahl zurückgegebener Profile (Standard: 10)
   */
  async searchAuthors(query: string, limit: number = 10): Promise<Profile[]> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });

    const response = await fetch(`${this.baseUrl}/search?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to search authors');
    }

    const data = await response.json();
    return data.profiles;
  }

  /**
   * Gibt alle Autoren zurück, denen der eingeloggte Nutzer folgt.
   * Auth erforderlich.
   * GET /profiles/subscriptions
   */
  async getSubscriptions(): Promise<Profile[]> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'GET',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    const data = await response.json();
    return data.profiles;
  }

  /**
   * Folgt einem Autor (Follow/Subscribe).
   * Auth erforderlich.
   * POST /profiles/:username/follow
   *
   * @param username Benutzername des zu abonnierenden Autors
   * @returns Das aktualisierte Profil mit `following: true`
   */
  async subscribeToAuthor(username: string): Promise<Profile> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}/${username}/follow`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await this.parseJsonSafe(response);
      throw new Error(error.message || 'Failed to subscribe');
    }

    const data = await response.json();
    return data.profile;
  }

  /**
   * Entfolgt einem Autor (Unfollow/Unsubscribe).
   * Auth erforderlich.
   * DELETE /profiles/:username/follow
   *
   * @param username Benutzername des zu entfolgenden Autors
   * @returns Das aktualisierte Profil mit `following: false`
   */
  async unsubscribeFromAuthor(username: string): Promise<Profile> {
    const authStore = useAuthStore();

    if (!authStore.token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}/${username}/follow`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await this.parseJsonSafe(response);
      throw new Error(error.message || 'Failed to unsubscribe');
    }

    const data = await response.json();
    return data.profile;
  }

  /**
   * Gibt das öffentliche Profil eines anderen Nutzers anhand seines Benutzernamens zurück.
   * Für das eigene Profil muss stattdessen `getProfile()` verwendet werden.
   * Auth optional (Token wird übermittelt wenn vorhanden, um `following` korrekt zu befüllen).
   * GET /profiles/:username
   *
   * @param username Benutzername des gesuchten Nutzers
   */
  async getProfileByUsername(username: string): Promise<Profile> {
    const authStore = useAuthStore();

    if (!username) {
      throw new Error('getProfileByUsername requires a valid username — use getProfile() for the current user');
    }

    const response = await fetch(`${this.baseUrl}/${username}`, {
      method: 'GET',
      headers: {
        ...(authStore.token ? { Authorization: `Token ${authStore.token}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data.profile;
  }

  /**
   * Prüft, ob der eingeloggte Nutzer einem bestimmten Autor folgt.
   * Gibt `false` zurück, wenn der Abruf der Subscriptions fehlschlägt.
   *
   * @param username Benutzername des zu prüfenden Autors
   */
  async isSubscribedTo(username: string): Promise<boolean> {
    try {
      const subscriptions = await this.getSubscriptions();
      return subscriptions.some((sub) => sub.username === username);
    } catch {
      return false;
    }
  }

  /**
   * Ändert das Passwort des eingeloggten Nutzers.
   * Auth erforderlich.
   * PUT /user/password
   *
   * @param currentPassword Aktuelles Passwort zur Verifikation
   * @param newPassword Neues Passwort
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const authStore = useAuthStore();

    if (!authStore.token) throw new Error('No authentication token found');

    const response = await fetch(`${this.apiUrl}/user/password`, {
      method: 'PUT',
      headers: {
        Authorization: `Token ${authStore.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await this.parseJsonSafe(response);
      throw new Error(error.message || 'Failed to change password');
    }
  }
}

export const userService = new UserService();
