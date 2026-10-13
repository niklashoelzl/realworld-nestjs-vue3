<!--
AuthorSearchSection.vue

Suchkomponente zum Finden und Abonnieren von Autoren.
Führt nach einer Eingabe Debounce von 250 ms automatisch eine Suche durch
und zeigt die Ergebnisse in einem scrollbaren Raster an.

Der eigene Benutzername wird aus den Suchergebnissen herausgefiltert.
Für jeden gefundenen Autor kann das Abonnement direkt in der Ergebnisliste
umgeschaltet werden. Nach jeder Änderung wird `subscription changed` emittiert.

Der Abonnementzustand wird aus `useSubscriptions` bezogen und ist damit
mit anderen Komponenten geteilt, die dasselbe Composable verwenden.

@prop currentUsername Benutzername des eingeloggten Nutzers (zum Herausfiltern aus den Ergebnissen)
@emits subscription-changed Wird emittiert, wenn ein Abonnement hinzugefügt oder entfernt wurde
-->

<template>
  <div class="bg-gray-700/30 rounded-lg border border-gray-600 p-4 mb-6">
    <!-- Search Input -->
    <div class="flex gap-2 mb-4 flex-col md:flex-row">
      <input v-model="authorSearchQuery" type="text" placeholder="Search for authors..."
        class="flex-1 rounded-md bg-white/5 px-3 py-2 text-white outline outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:outline-indigo-500"
        @keyup.enter="searchAuthors" />
      <button @click="searchAuthors" :disabled="searchLoading"
        class="flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
        <span v-if="searchLoading" class="loading loading-spinner loading-sm"></span>
        <Search v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Search Results -->
    <div v-if="foundAuthors.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
      <div v-for="author in foundAuthors" :key="author.username"
        class="bg-gray-800 rounded-lg p-3 flex items-center justify-between gap-3 border border-transparent hover:border-indigo-500 transition-colors">
        <RouterLink :to="`/profile/${author.username}`" class="flex items-center gap-3 flex-1 min-w-0">
          <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="author.image" :src="author.image" :alt="author.username" class="w-full h-full object-cover">
            <span v-else class="text-sm font-bold text-white">{{ (author.username?.charAt(0) || '?').toUpperCase()
            }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ author.username }}</p>
            <p v-if="author.bio" class="text-xs text-gray-400 truncate">{{ author.bio }}</p>
          </div>
        </RouterLink>
        <button @click="toggleSubscription(author.username)" :disabled="searchLoading"
          :class="['ml-2 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors', isSubscribedTo(author.username) ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-indigo-500 text-white hover:bg-indigo-400']">
          {{ isSubscribedTo(author.username) ? 'Unsubscribe' : 'Subscribe' }}
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div v-else-if="!searchLoading && authorSearchQuery" class="text-center py-4 text-gray-400">
      No authors found matching "{{ authorSearchQuery }}"
    </div>

    <!-- Initial State -->
    <div v-else-if="!searchLoading" class="text-center py-4 text-gray-400">
      Start typing to search for authors
    </div>

    <!-- Error Message -->
    <div v-if="searchError" class="mt-3 rounded-md bg-red-500/10 border border-red-500/20 p-3">
      <p class="text-sm text-red-400">{{ searchError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import type { Profile } from '@/services/userService';
import { userService } from '@/services/userService';
import { useSubscriptions } from '@/composables/use-profile';
import { useAuthStore } from '@/stores/authStore';
import { Search } from 'lucide-vue-next';

const props = defineProps<{ currentUsername?: string }>();

const emit = defineEmits<{ 'subscription-changed': [] }>();

const authStore = useAuthStore();

const {
  subscriptions,
  fetchSubscriptions,
  subscribeToAuthor: subscribeAuthorFromService,
  unsubscribeFromAuthor: unsubscribeAuthorFromService,
} = useSubscriptions();

const searchLoading = ref(false);
const searchError = ref('');
const authorSearchQuery = ref('');
const foundAuthors = ref<Profile[]>([]);

/** Timer Handle für die Suchanfrage Debounce */
let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
  try {
    await fetchSubscriptions();
  } catch {
    // Fehler beim initialen Abonnementabruf werden stillschweigend ignoriert
  }
});

/**
 * Beobachtet den Suchbegriff und startet nach 250 ms Debounce eine neue Suche.
 * Leert die Ergebnisliste sofort, wenn das Eingabefeld geleert wird.
 */
watch(authorSearchQuery, (query) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }

  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    foundAuthors.value = [];
    searchError.value = '';
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    void searchAuthors();
  }, 250);
});

/**
 * Aktualisiert die Suchergebnisse, wenn sich der Subscriptionzustand ändert,
 * damit Subscribe/Unsubscribe Buttons in den Ergebnissen sofort korrekt sind.
 */
watch(
  subscriptions,
  () => {
    if (authorSearchQuery.value.trim()) {
      void searchAuthors();
    }
  },
  { deep: true },
);

/**
 * Sucht nach Autoren anhand des aktuellen Suchbegriffs.
 * Filtert den eigenen Benutzernamen aus den Ergebnissen heraus.
 */
async function searchAuthors() {
  if (!authorSearchQuery.value.trim()) {
    foundAuthors.value = [];
    return;
  }

  const currentUsername = props.currentUsername || authStore.user?.username;

  try {
    searchLoading.value = true;
    searchError.value = '';

    foundAuthors.value = await userService.searchAuthors(authorSearchQuery.value, 10);

    if (currentUsername) {
      foundAuthors.value = foundAuthors.value.filter(
        author => author.username !== currentUsername
      );
    }
  } catch (err: any) {
    searchError.value = err.message;
  } finally {
    searchLoading.value = false;
  }
}

/**
 * Gibt an, ob der eingeloggte Nutzer einem bestimmten Autor folgt.
 *
 * @param username Benutzername des Autors
 */
function isSubscribedTo(username: string): boolean {
  return subscriptions.value.some(sub => sub.username === username);
}

/**
 * Schaltet den Subscription-Status eines Autors um.
 *
 * @param username Benutzername des Autors
 */
async function toggleSubscription(username: string) {
  try {
    if (isSubscribedTo(username)) {
      await unsubscribeAuthor(username);
    } else {
      await subscribeAuthor(username);
    }
  } catch (err) {
    console.error('Toggle subscription error:', err);
  }
}

/**
 * Abonniert einen Autor und emittiert `subscription changed`.
 *
 * @param username Benutzername des zu abonnierenden Autors
 */
async function subscribeAuthor(username: string) {
  try {
    searchLoading.value = true;
    await subscribeAuthorFromService(username);
    emit('subscription-changed');
  } catch (err: any) {
    searchError.value = err.message;
  } finally {
    searchLoading.value = false;
  }
}

/**
 * Beendet die Subscription eines Autors und emittiert `subscription changed`.
 *
 * @param username Benutzername des zu entfolgenden Autors
 */
async function unsubscribeAuthor(username: string) {
  try {
    searchLoading.value = true;
    await unsubscribeAuthorFromService(username);
    emit('subscription-changed');
  } catch (err: any) {
    searchError.value = err.message;
  } finally {
    searchLoading.value = false;
  }
}
</script>
