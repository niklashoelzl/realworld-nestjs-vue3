<!--
SubscribedAuthorsList.vue

Zeigt eine Rasteransicht aller abonnierten Autoren an.
Jede Karte enthält Avatar, Benutzername, Bio und einen Unsubscribe Button.
Bei leerer Liste wird ein Hinweistext mit Icon angezeigt.

Das Klicken auf einen Autor navigiert zu dessen Profilseite.
Das Subscription Event wird an den Parent delegiert.

@prop authors Liste der abonnierten Autorenprofile
@emits unsubscribe Wird mit dem Benutzernamen emittiert, wenn der Nutzer die Subscription beendet
-->

<template>
  <div v-if="authors.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="author in authors" :key="author.username"
      class="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-indigo-500 transition-colors">
      <!-- Header with Author Info and Unsubscribe Button -->
      <div class="flex items-center justify-between mb-3">
        <RouterLink :to="`/profile/${author.username}`" class="flex items-center gap-3 min-w-0">
          <!-- Avatar -->
          <div class="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
            <img v-if="author.image" :src="author.image" :alt="author.username" class="w-full h-full object-cover">
            <span v-else class="text-lg font-bold text-white">{{ (author.username?.charAt(0) || '?').toUpperCase()
            }}</span>
          </div>
          <!-- User Info -->
          <div>
            <p class="font-semibold text-white">{{ author.username }}</p>
            <p v-if="author.bio" class="text-sm text-gray-400 truncate">{{ author.bio }}</p>
          </div>
        </RouterLink>
        <!-- Unsubscribe Button -->
        <button @click="handleUnsubscribe(author.username)"
          class="rounded-md bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-500 transition-colors"
          title="Unsubscribe">
          Unsubscribe
        </button>
      </div>
      <!-- Bio -->
      <p v-if="author.bio" class="text-sm text-gray-300">{{ author.bio }}</p>
      <p v-else class="text-sm text-gray-500 italic">No bio available</p>
    </div>
  </div>

  <!-- Empty State -->
  <div v-else class="text-center py-8 text-gray-400">
    <Heart class="w-12 h-12 mx-auto mb-3 opacity-50" />
    <p>You haven't subscribed to any authors yet</p>
    <p class="text-sm mt-1">Click "Find Authors" to start subscribing</p>
  </div>
</template>

<script setup lang="ts">
import type { Profile } from '@/services/userService';
import { RouterLink } from 'vue-router';
import { Heart } from 'lucide-vue-next';

const props = defineProps<{ authors: Profile[] }>();

const emit = defineEmits<{ 'unsubscribe': [username: string] }>();

/**
 * Emittiert das `unsubscribe` Event mit dem Benutzernamen des zu entfolgenden Autors.
 *
 * @param username Benutzername des Autors
 */
function handleUnsubscribe(username: string) { emit('unsubscribe', username); }
</script>
