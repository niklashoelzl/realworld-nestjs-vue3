/**
 * src/stores/authStore.ts
 *
 * Pinia Store für den Authentifizierungszustand der Applikation.
 * Verwaltet den eingeloggten Nutzer und das JWT Token.
 *
 * Token und Nutzerdaten werden in localStorage persistiert,
 * sodass die Session nach einem Seitenneuladen erhalten bleibt.
 * Beim Store Start wird der Nutzer automatisch vom Backend
 * nachgeladen, sofern ein Token vorhanden ist.
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { authService } from '@/services/authService';

interface User {
  email: string;
  username: string;
  bio?: string | null;
  image?: string | null;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  /** Initialisierung: Nutzer aus localStorage wiederherstellen */
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem('user');
    }
  }

  const token = ref<string | null>(localStorage.getItem('token'));

  /** Gibt an, ob aktuell ein Nutzer eingeloggt ist */
  const isAuthenticated = computed(() => !!token.value);

  /** Synchronisiert Nutzeränderungen automatisch in den localStorage */
  watch(
    user,
    (value) => {
      if (value) {
        localStorage.setItem('user', JSON.stringify(value));
      } else {
        localStorage.removeItem('user');
      }
    },
    { deep: true },
  );

  /**
   * Meldet einen Nutzer mit E-Mail und Passwort an.
   * Speichert Token und Nutzerdaten lokal und lädt anschließend
   * das vollständige Profil vom Backend nach.
   *
   * @param email Registrierte E-Mail-Adresse
   * @param password Passwort des Nutzers
   * @returns Die vollständige API Antwort inklusive Nutzerdaten und Token
   */
  async function login(email: string, password: string) {
    const data = await authService.login(email, password);
    const userData = data.user;

    token.value = userData.token;
    localStorage.setItem('token', userData.token);

    user.value = {
      email: userData.email,
      username: userData.username,
      bio: userData.bio || null,
      image: userData.image || null,
    };

    await fetchUser();
    return data;
  }

  /**
   * Registriert einen neuen Nutzer.
   * Gibt die API Antwort zurück; ein automatischer Login findet nicht statt.
   *
   * @param email E-Mail-Adresse des neuen Nutzers
   * @param username Gewünschter Benutzername
   * @param password Gewünschtes Passwort
   */
  async function register(email: string, username: string, password: string) {
    return await authService.register(email, username, password);
  }

  /**
   * Lädt die aktuellen Nutzerdaten vom Backend und aktualisiert den lokalen Zustand.
   * Wird nach dem Login sowie beim App Start aufgerufen, sofern ein Token vorhanden ist.
   * Fehler werden ignoriert, um den Nutzer nicht auszusperren.
   */
  async function fetchUser() {
    if (!token.value) return;

    try {
      const data = await authService.getMe(token.value);
      const currentUser = (data as any).user ?? data;

      if (!currentUser?.username) {
        throw new Error('Invalid profile response');
      }

      user.value = {
        ...currentUser,
        bio: currentUser.bio || null,
        image: currentUser.image || null,
      };
    } catch {
    }
  }

  /**
   * Meldet den aktuellen Nutzer ab.
   * Löscht Token und Nutzerdaten aus Speicher und localStorage.
   */
  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /** Automatischer Nutzerabruf beim Store Start, sofern ein Token vorhanden ist */
  if (token.value) {
    fetchUser();
  }

  /**
   * Lädt ein Profilbild hoch und aktualisiert das lokale Nutzerprofil.
   * Die Datei wird als Base64 String kodiert und an den Auth Service übergeben.
   *
   * @param file Das hochzuladende Bild
   */
  async function uploadProfileImage(file: File) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          await authService.uploadProfileImage(base64, token.value!);

          if (user.value) {
            user.value.image = base64;
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('File could not be read'));
      reader.readAsDataURL(file);
    });
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    uploadProfileImage,
  };
});
