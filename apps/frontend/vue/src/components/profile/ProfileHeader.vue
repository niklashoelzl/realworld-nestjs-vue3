<!--
ProfileHeader.vue

Zeigt den Profilkopf eines Nutzers an.
Im Anzeigemodus sind Avatar, Benutzername und Bio sichtbar.
Im Bearbeitungsmodus (nur eigenes Profil) können Username, E-Mail und Bio
geändert sowie ein neues Profilbild hochgeladen werden.

Für fremde Profile zeigt die Komponente stattdessen einen
Subscribe/Unsubscribe Button und nutzt den geteilten Subscription-Zustand
aus `useSubscriptions`.

@prop username          Benutzername des angezeigten Profils (fehlt = eigenes Profil)
@prop currentUsername   Benutzername des eingeloggten Nutzers (für Profilvergleich)
@prop editable          Gibt an, ob das Profil bearbeitet werden darf (Standard: true)
-->

<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-6">
    <div class="flex gap-8 items-start flex-col md:flex-row">
      <!-- Profile Image Section -->
      <div class="flex flex-col items-center">
        <div class="relative mb-4">
          <div
            class="w-32 h-32 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden border-4 border-indigo-500 shrink-0">
            <img v-if="displayProfile?.image" :src="displayProfile.image" :alt="displayProfile?.username"
              class="w-full h-full object-cover">
            <span v-else class="text-4xl font-bold text-white">
              {{ (displayProfile?.username?.charAt(0) || '?').toUpperCase() }}
            </span>
          </div>
          <label v-if="canEdit"
            class="absolute bottom-0 right-0 w-10 h-10 bg-gray-700 border-2 border-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
            :class="{ 'opacity-50 cursor-not-allowed': profileLoading }">
            <SquarePen class="w-5 h-5 text-white" />
            <input type="file" @change="handleProfileImageChange" accept="image/*" class="hidden"
              :disabled="profileLoading" />
          </label>
        </div>
        <p v-if="profileImageError" class="text-xs text-red-400 mt-2">{{ profileImageError }}</p>
      </div>

      <!-- Profile Info Section -->
      <div class="flex-1 w-full">
        <h1 class="text-3xl font-bold text-white mb-2">{{ displayProfile?.username }}</h1>
        <p v-if="canEdit" class="text-gray-400 mb-4">{{ (displayProfile as User)?.email }}</p>

        <!-- Edit Mode -->
        <div v-if="canEdit && isEditing" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-100 mb-1">Username</label>
            <input v-model="editForm.username" type="text"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
              :disabled="profileLoading" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-100 mb-1">Email</label>
            <input v-model="editForm.email" type="email"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
              :disabled="profileLoading" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-100 mb-1">Bio</label>
            <textarea v-model="editForm.bio"
              class="block w-full rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500 resize-none"
              rows="3" placeholder="Tell us about yourself..." :disabled="profileLoading"></textarea>
          </div>

          <!-- Passwort ändern -->
          <div class="border-t border-gray-700 pt-4">
            <button @click="showPasswordForm = !showPasswordForm"
              class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-3 flex items-center gap-1">
              <KeyRound class="w-4 h-4" />
              {{ showPasswordForm ? 'Passwort ausblenden' : 'Passwort ändern' }}
            </button>

            <!-- Erfolg Meldung -->
            <div v-if="passwordSuccess" class="rounded-md bg-green-500/10 border border-green-500/20 p-3 mb-3">
              <p class="text-sm text-green-400">{{ passwordSuccess }}</p>
            </div>

            <div v-if="showPasswordForm" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-100 mb-1">Current Passwort</label>
                <div class="relative">
                  <input v-model="passwordForm.current" :type="showCurrent ? 'text' : 'password'"
                    class="block w-full rounded-md bg-white/5 px-3 py-2 pr-10 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                    :disabled="passwordLoading" />
                  <button type="button" @click="showCurrent = !showCurrent"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <Eye v-if="!showCurrent" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-100 mb-1">New password</label>
                <div class="relative">
                  <input v-model="passwordForm.new" :type="showNew ? 'text' : 'password'"
                    class="block w-full rounded-md bg-white/5 px-3 py-2 pr-10 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                    :disabled="passwordLoading" />
                  <button type="button" @click="showNew = !showNew"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <Eye v-if="!showNew" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-100 mb-1">Confirm new password</label>
                <div class="relative">
                  <input v-model="passwordForm.confirm" :type="showConfirm ? 'text' : 'password'"
                    class="block w-full rounded-md bg-white/5 px-3 py-2 pr-10 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
                    :disabled="passwordLoading" />
                  <button type="button" @click="showConfirm = !showConfirm"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                    <Eye v-if="!showConfirm" class="w-4 h-4" />
                    <EyeOff v-else class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-if="passwordError" class="rounded-md bg-red-500/10 border border-red-500/20 p-3">
                <p class="text-sm text-red-400">{{ passwordError }}</p>
              </div>
              <button @click="handleChangePassword" :disabled="passwordLoading"
                class="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50 transition-colors">
                {{ passwordLoading ? 'Saving...' : 'Save password' }}
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="profileError" class="rounded-md bg-red-500/10 border border-red-500/20 p-3">
            <p class="text-sm text-red-400">{{ profileError }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button @click="saveProfile" :disabled="profileLoading"
              class="flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
              {{ profileLoading ? 'Saving...' : 'Save Changes' }}
            </button>
            <button @click="cancelEditMode" :disabled="profileLoading"
              class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50">
              Cancel
            </button>
          </div>
        </div>

        <!-- View Mode -->
        <div v-else>
          <p v-if="displayProfile?.bio" class="text-gray-300 mb-4">{{ displayProfile.bio }}</p>
          <p v-else class="text-gray-500 italic mb-4">No bio yet</p>
          <div class="flex flex-wrap gap-3">
            <button v-if="canEdit" @click="startEditMode"
              class="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
              <UserPen class="w-4 h-4" />
              Edit Profile
            </button>
            <button v-else-if="displayProfile?.username" @click="toggleSubscription" :disabled="subscriptionLoading"
              class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors"
              :class="isSubscribed ? 'bg-gray-600 hover:bg-gray-500' : 'bg-indigo-500 hover:bg-indigo-400'">
              <span v-if="subscriptionLoading" class="loading loading-spinner loading-sm"></span>
              {{ isSubscribed ? 'Unsubscribe' : 'Subscribe' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useProfile } from '@/composables/use-profile';
import { useSubscriptions } from '@/composables/use-profile';
import { SquarePen, UserPen, KeyRound, Eye, EyeOff } from 'lucide-vue-next';
import type { User } from '@/services/userService';
import { userService } from '@/services/userService';

const props = defineProps<{
  username?: string;
  currentUsername?: string;
  editable?: boolean;
}>();

const authStore = useAuthStore();

/** Gibt an, ob das Profil bearbeitbar ist; standardmäßig true */
const canEdit = computed(() => props.editable !== false);
const { subscriptions, fetchSubscriptions, subscribeToAuthor, unsubscribeFromAuthor } = useSubscriptions();

const {
  profile,
  loading: profileLoading,
  error: profileError,
  isEditing,
  startEdit,
  cancelEdit,
  updateProfile: updateProfileData,
  uploadProfileImage: uploadImageToService,
  fetchProfile,
  clearError
} = useProfile();

const profileImageError = ref('');
const subscriptionLoading = ref(false);

/** Zustand des Passwortänderungs Formulars */
const showPasswordForm = ref(false);
const passwordLoading = ref(false);
const passwordError = ref('');
const passwordSuccess = ref('');
const passwordForm = ref({ current: '', new: '', confirm: '' });
const showCurrent = ref(false);
const showNew = ref(false);
const showConfirm = ref(false);

/**
 * Gibt an, ob das angezeigte Profil das eigene Profil des eingeloggten Nutzers ist.
 * Ohne `username` Prop wird immer das eigene Profil angezeigt.
 */
const isOwnProfile = computed(() => {
  if (!props.username) return true;
  return props.currentUsername ? props.username === props.currentUsername : false;
});

/** Benutzername für den Profilabruf; `undefined` bei eigenem Profil */
const profileUsername = computed(() => (isOwnProfile.value ? undefined : props.username));

/**
 * Konvertiert den `authStore` Nutzer in ein `User` Objekt.
 * Gibt `null` zurück, wenn kein Nutzer eingeloggt ist.
 */
function normalizeStoreUser() {
  if (!authStore.user) return null;
  return {
    email: authStore.user.email,
    username: authStore.user.username,
    bio: authStore.user.bio ?? undefined,
    image: authStore.user.image ?? undefined,
  } as User;
}

/**
 * Angezeigtes Profil: priorisiert den geladenen `profile` Wert aus dem Composable,
 * fällt bei eigenem Profil auf den `authStore` Nutzer zurück.
 */
const displayProfile = computed(() => profile.value ?? (isOwnProfile.value ? normalizeStoreUser() : null));

/** Gibt an, ob der eingeloggte Nutzer dem angezeigten Profil folgt */
const isSubscribed = computed(() => {
  if (!displayProfile.value?.username) return false;
  return subscriptions.value.some(sub => sub.username === displayProfile.value?.username);
});

const editForm = ref({ username: '', email: '', bio: '' });

/** Synchronisiert `profile` mit Änderungen im `authStore` beim eigenen Profil */
watch(
  () => authStore.user,
  (user) => {
    if (isOwnProfile.value && user) profile.value = normalizeStoreUser();
  },
  { immediate: true, deep: true },
);

onMounted(async () => {
  if (isOwnProfile.value && authStore.user) profile.value = normalizeStoreUser();
  try {
    await fetchProfile(profileUsername.value);
  } catch {
    if (isOwnProfile.value && authStore.user) profile.value = normalizeStoreUser();
  }
  /** Subscriptions nur für fremde Profile laden, da der eigene Nutzer sich nicht selbst abonnieren kann */
  if (!canEdit.value) void fetchSubscriptions();
});

/** Lädt das Profil neu, wenn sich der angezeigte Benutzername ändert */
watch(() => props.username, (nextUsername) => {
  if ((isOwnProfile.value || !nextUsername) && authStore.user) {
    profile.value = normalizeStoreUser();
    return;
  }
  void fetchProfile(profileUsername.value);
});

/**
 * Verarbeitet den Datei Input für das Profilbild.
 * Lädt das neue Bild hoch und aktualisiert lokales Profil sowie `authStore`.
 *
 * @param event Das native Change Event des File Inputs
 */
async function handleProfileImageChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  profileImageError.value = '';
  try {
    const updated = await uploadImageToService(file);
    profile.value = updated;
    if (authStore.user) authStore.user = { ...authStore.user, image: updated.image };
  } catch (err: any) {
    profileImageError.value = err.message;
  }
}

/**
 * Ändert das Passwort des eingeloggten Nutzers nach clientseitiger Validierung.
 * Prüft, ob alle Felder ausgefüllt sind, ob die neuen Passwörter übereinstimmen
 * und ob das Passwort mindestens 8 Zeichen lang ist.
 */
async function handleChangePassword() {
  passwordError.value = '';
  passwordSuccess.value = '';

  if (!passwordForm.value.current || !passwordForm.value.new || !passwordForm.value.confirm) {
    passwordError.value = 'Bitte alle Felder ausfüllen';
    return;
  }

  if (passwordForm.value.new !== passwordForm.value.confirm) {
    passwordError.value = 'Neue Passwörter stimmen nicht überein';
    return;
  }

  if (passwordForm.value.new.length < 8) {
    passwordError.value = 'Passwort muss mindestens 8 Zeichen lang sein';
    return;
  }

  try {
    passwordLoading.value = true;
    await userService.changePassword(passwordForm.value.current, passwordForm.value.new);
    passwordSuccess.value = 'Passwort erfolgreich geändert';
    passwordForm.value = { current: '', new: '', confirm: '' };
    showPasswordForm.value = false;
  } catch (err: any) {
    passwordError.value = err.message;
  } finally {
    passwordLoading.value = false;
  }
}

/**
 * Schaltet den Subscription-Status des angezeigten Autors um.
 * Ist der Nutzer bereits abonniert, wird die Subscription entfernt und umgekehrt.
 */
async function toggleSubscription() {
  if (!displayProfile.value?.username) return;
  try {
    subscriptionLoading.value = true;
    if (isSubscribed.value) {
      await unsubscribeFromAuthor(displayProfile.value.username);
    } else {
      await subscribeToAuthor(displayProfile.value.username);
    }
    await fetchSubscriptions();
  } finally {
    subscriptionLoading.value = false;
  }
}

/**
 * Speichert die Profilformulardaten und aktualisiert lokales Profil sowie `authStore`.
 */
async function saveProfile() {
  clearError();
  try {
    const updated = await updateProfileData({
      username: editForm.value.username,
      email: editForm.value.email,
      bio: editForm.value.bio,
    });
    if (updated) {
      profile.value = updated;
      editForm.value = {
        username: updated.username,
        email: updated.email || '',
        bio: updated.bio || '',
      };
    }
    if (authStore.user && updated) {
      authStore.user = {
        ...authStore.user,
        username: updated.username,
        email: updated.email,
        bio: updated.bio,
        image: updated.image,
      };
    }
  } catch (err) {
    console.error('Save profile error:', err);
  }
}

/**
 * Aktiviert den Bearbeitungsmodus und befüllt das Editierformular
 * mit den aktuellen Profilwerten.
 */
function startEditMode() {
  if (!canEdit.value) return;
  if (displayProfile.value) {
    const current = displayProfile.value as User;
    editForm.value = {
      username: current.username,
      email: current.email || '',
      bio: current.bio || '',
    };
  }
  passwordSuccess.value = '';
  startEdit();
}

/**
 * Bricht den Bearbeitungsmodus ab und setzt alle Formular und Fehlerzustände zurück.
 */
function cancelEditMode() {
  cancelEdit();
  profileImageError.value = '';
  showPasswordForm.value = false;
  passwordForm.value = { current: '', new: '', confirm: '' };
  passwordError.value = '';
  showCurrent.value = false;
  showNew.value = false;
  showConfirm.value = false;
}
</script>
