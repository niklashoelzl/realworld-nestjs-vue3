/**
 * src/composables/use-profile.ts
 *
 * Vue Composables für die Verwaltung von Nutzerprofilen und Abonnements.
 *
 * `useProfile` verwaltet das Profil eines einzelnen Nutzers (eigenes oder fremdes)
 * und stellt Methoden zum Laden, Bearbeiten und Hochladen des Profilbilds bereit.
 *
 * `useSubscriptions` verwaltet die Liste abonnierter Autoren. Der Zustand wird
 * über `useSharedSubscriptions` als Modul Singleton geteilt, sodass alle
 * Composable Instanzen denselben reaktiven Zustand verwenden.
 */

import { ref, type Ref } from 'vue';
import type { UpdateProfileDto, User, Profile } from '@/services/userService';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/stores/authStore';

interface UseProfileReturn {
  profile: Ref<User | Profile | null>;
  loading: Ref<boolean>;
  error: Ref<string>;
  isEditing: Ref<boolean>;

  startEdit: () => void;
  cancelEdit: () => void;
  updateProfile: (data: UpdateProfileDto) => Promise<User | null>;
  uploadProfileImage: (file: File) => Promise<User>;
  fetchProfile: (username?: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Composable zur Verwaltung eines Nutzerprofils.
 * Ohne `username` wird das eigene Profil geladen (`GET /user`),
 * mit `username` das Profil eines anderen Nutzers (`GET /profiles/:username`).
 *
 * @returns Reaktive Zustände und Methoden für ein Nutzerprofil
 */
export function useProfile(): UseProfileReturn {
  const profile = ref<User | Profile | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string>('');
  const isEditing = ref<boolean>(false);

  /**
   * Lädt ein Nutzerprofil vom Backend.
   * Ohne `username`: eigenes Profil (`GET /user`).
   * Mit `username`: fremdes Profil (`GET /profiles/:username`).
   *
   * @param username Benutzername des zu ladenden Profils (optional)
   */
  async function fetchProfile(username?: string) {
    try {
      loading.value = true;
      error.value = '';
      profile.value = null;

      const hasValidUsername = username !== undefined && username !== null && username !== '';

      const result = !hasValidUsername
        ? await userService.getProfile()
        : await userService.getProfileByUsername(username);
      profile.value = result;
    } catch (err: any) {
      error.value = err.message || 'Failed to load profile';
      console.error('fetchProfile error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Aktualisiert das eigene Nutzerprofil und synchronisiert die Änderungen
   * mit dem `authStore`. Beendet den Bearbeitungsmodus nach Erfolg.
   *
   * @param data Zu ändernde Profilfelder
   * @returns Der aktualisierte Nutzer oder `null` bei Fehler
   */
  async function updateProfile(data: UpdateProfileDto) {
    try {
      loading.value = true;
      error.value = '';

      const updated = await userService.updateProfile(data);

      if (updated) {
        profile.value = updated;

        const authStore = useAuthStore();
        authStore.user = updated as any;
      }

      isEditing.value = false;

      return updated;
    } catch (err: any) {
      error.value = err.message || 'Failed to update profile';
      console.error('updateProfile error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Lädt ein Profilbild hoch und aktualisiert lokales Profil sowie `authStore`.
   * Validiert Dateityp (muss `image/*` sein) und Dateigröße (max. 5 MB).
   *
   * @param file Das hochzuladende Bild
   * @returns Der aktualisierte Nutzer
   */
  async function uploadProfileImage(file: File): Promise<User> {
    try {
      loading.value = true;
      error.value = '';

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be smaller than 5MB');
      }

      const result = await userService.uploadProfileImage(file);

      if (result) {
        profile.value = result;

        const authStore = useAuthStore();
        authStore.user = result as any;
      }

      return result;
    } catch (err: any) {
      error.value = err.message || 'Failed to upload image';
      console.error('uploadProfileImage error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /** Aktiviert den Bearbeitungsmodus und löscht Fehlermeldungen */
  function startEdit() {
    isEditing.value = true;
    error.value = '';
  }

  /** Bricht den Bearbeitungsmodus ab und löscht Fehlermeldungen */
  function cancelEdit() {
    isEditing.value = false;
    error.value = '';
  }

  /** Setzt den Fehlerzustand zurück */
  function clearError() {
    error.value = '';
  }

  return {
    profile,
    loading,
    error,
    isEditing,
    startEdit,
    cancelEdit,
    updateProfile,
    uploadProfileImage,
    fetchProfile,
    clearError,
  };
}

interface UseSubscriptionsReturn {
  subscriptions: Ref<Profile[]>;
  loading: Ref<boolean>;
  error: Ref<string>;

  fetchSubscriptions: () => Promise<void>;
  subscribeToAuthor: (username: string) => Promise<void>;
  unsubscribeFromAuthor: (username: string) => Promise<void>;
  isSubscribedTo: (username: string) => boolean;
  clearError: () => void;
}

/**
 * Composable zur Verwaltung der abonnierten Autoren.
 * Delegiert an `useSharedSubscriptions`, um einen geteilten reaktiven
 * Zustand über alle Composable Instanzen hinweg zu gewährleisten.
 *
 * @returns Reaktive Zustände und Methoden für Abonnements
 */
export function useSubscriptions(): UseSubscriptionsReturn {
  return useSharedSubscriptions();
}

/**
 * Modul weit geteilter Zustand für Abonnements.
 * Durch die Deklaration außerhalb von `useSharedSubscriptions` teilen sich
 * alle Instanzen des Composables dieselben reaktiven Referenzen.
 */
const sharedSubscriptions = ref<Profile[]>([]);
const sharedSubscriptionsLoading = ref(false);
const sharedSubscriptionsError = ref('');

/**
 * Interne Implementierung des Subscription Composables mit geteiltem Zustand.
 */
function useSharedSubscriptions(): UseSubscriptionsReturn {
  const subscriptions = sharedSubscriptions;
  const loading = sharedSubscriptionsLoading;
  const error = sharedSubscriptionsError;

  /**
   * Lädt alle Autoren, denen der eingeloggte Nutzer folgt, vom Backend.
   */
  async function fetchSubscriptions() {
    try {
      loading.value = true;
      error.value = '';
      subscriptions.value = await userService.getSubscriptions();
    } catch (err: any) {
      error.value = err.message || 'Failed to load subscriptions';
      console.error('fetchSubscriptions error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Folgt einem Autor und aktualisiert anschließend die Abonnementliste.
   *
   * @param username Benutzername des zu abonnierenden Autors
   */
  async function subscribeToAuthor(username: string) {
    try {
      loading.value = true;
      error.value = '';

      await userService.subscribeToAuthor(username);
      await fetchSubscriptions();
    } catch (err: any) {
      error.value = err.message || 'Failed to subscribe';
      console.error('subscribeToAuthor error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Entfolgt einem Autor und entfernt ihn direkt aus dem lokalen Zustand.
   *
   * @param username Benutzername des zu entfolgenden Autors
   */
  async function unsubscribeFromAuthor(username: string) {
    try {
      loading.value = true;
      error.value = '';

      await userService.unsubscribeFromAuthor(username);
      subscriptions.value = subscriptions.value.filter(sub => sub.username !== username);
    } catch (err: any) {
      error.value = err.message || 'Failed to unsubscribe';
      console.error('unsubscribeFromAuthor error:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Prüft synchron, ob der eingeloggte Nutzer einem bestimmten Autor folgt.
   * Basiert auf dem lokal gecachten Abonnementzustand.
   *
   * @param username Benutzername des zu prüfenden Autors
   */
  function isSubscribedTo(username: string): boolean {
    return subscriptions.value.some(sub => sub.username === username);
  }

  /** Setzt den Fehlerzustand zurück */
  function clearError() {
    error.value = '';
  }

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    subscribeToAuthor,
    unsubscribeFromAuthor,
    isSubscribedTo,
    clearError,
  };
}
