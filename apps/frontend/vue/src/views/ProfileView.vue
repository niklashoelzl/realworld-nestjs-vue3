<!--
ProfileView.vue

Profilseite eines Nutzers.
Zeigt den Profilkopf (`ProfileHeader`), eine Liste der Artikel des Nutzers
sowie, nur beim eigenen Profil, die Subscriptionliste mit Such und Verwaltungsfunktion.

Ohne URL Parameter (`/profile`) wird das eigene Profil angezeigt.
Mit Benutzernamen (`/profile/:username`) wird das fremde Profil angezeigt
ohne Bearbeitungsmöglichkeit und ohne Subscription Sektion.

Artikel können direkt in der Liste geliked werden.
-->

<template>
  <div class="min-h-screen bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Profile Header Component -->
      <ProfileHeader :username="viewedUsername" :editable="!viewedUsername" />

      <!-- Artikel des Nutzers -->
      <div class="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen class="w-6 h-6 text-indigo-400" />
            Articles ({{ articlesCount }})
          </h2>
          <RouterLink v-if="isOwnProfile" to="/articles/new"
            class="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
            <PenLine class="w-4 h-4" />
            Write Article
          </RouterLink>
        </div>

        <!-- Loading -->
        <div v-if="articlesLoading" class="text-center py-8 text-gray-500 animate-pulse">
          Loading articles…
        </div>

        <!-- Empty -->
        <div v-else-if="articles.length === 0" class="text-center py-8 text-gray-500">
          No articles found.
        </div>

        <!-- Liste -->
        <ul v-else class="space-y-4">
          <li v-for="article in articles" :key="article.slug">
            <RouterLink :to="`/articles/${article.slug}`"
              class="block rounded-lg border border-gray-700 bg-gray-900/40 p-5 hover:border-indigo-500 hover:bg-gray-900/60 transition-colors cursor-pointer">
              <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>{{ new Date(article.createdAt).toLocaleDateString('de-DE') }}</span>
                <div class="flex flex-wrap gap-1">
                  <span v-for="tag in article.tagList" :key="tag"
                    class="bg-gray-700 text-gray-300 rounded-full px-2 py-0.5 text-xs">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <h3 class="text-base font-semibold text-white mb-1">{{ article.title }}</h3>
              <p class="text-sm text-gray-400 line-clamp-2">{{ article.description }}</p>
              <div class="flex justify-end mt-4">
                <button @click.prevent.stop="toggleArticleFavorite(article)" :disabled="!isAuthenticated"
                  :class="['flex items-center gap-1 text-sm transition-colors', article.favorited ? 'text-red-400' : 'text-gray-600 hover:text-red-400', !isAuthenticated && 'cursor-default']">
                  <Heart class="w-4 h-4" :fill="article.favorited ? 'currentColor' : 'none'" />
                  {{ article.favoritesCount }}
                </button>
              </div>
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- Subscriptions Section — nur eigenes Profil -->
      <template v-if="isOwnProfile">
        <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div class="flex items-center justify-between mb-6 flex-col md:flex-row gap-4">
            <h2 class="text-2xl font-bold text-white flex items-center gap-2">
              <Heart class="w-6 h-6 text-indigo-400" />
              Subscribed Authors ({{ subscriptionsArray.length }})
            </h2>
            <button @click="showFindAuthors = !showFindAuthors"
              class="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
              <Plus class="w-4 h-4" />
              {{ showFindAuthors ? 'Hide' : 'Find Authors' }}
            </button>
          </div>
          <AuthorSearchSection v-if="showFindAuthors" @subscription-changed="fetchSubscriptions" />
          <SubscribedAuthorsList :authors="subscriptionsArray" @unsubscribe="handleUnsubscribe" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { useSubscriptions } from '@/composables/use-profile';
import { useArticleList } from '@/composables/use-article';
import { useAuthStore } from '@/stores/authStore';
import { Heart, Plus, BookOpen, PenLine } from 'lucide-vue-next';
import ProfileHeader from '../components/profile/ProfileHeader.vue';
import AuthorSearchSection from '../components/profile/AuthorSearchSection.vue';
import SubscribedAuthorsList from '../components/profile/SubscribedAuthorsList.vue';
import type { Article } from '@/services/articleService';

const route = useRoute();
const authStore = useAuthStore();
const { subscriptions, fetchSubscriptions, unsubscribeFromAuthor } = useSubscriptions();
const { articles, articlesCount, loading: articlesLoading, fetchArticles, toggleFavorite: toggleFavoriteData } = useArticleList();

const showFindAuthors = ref(false);
const subscriptionsArray = computed(() => subscriptions.value);

/**
 * Benutzername aus dem URL Parameter.
 * `undefined` wenn kein Parameter vorhanden (eigenes Profil).
 */
const viewedUsername = computed(() => {
  const username = route.params.username;
  return typeof username === 'string' && username !== '' ? username : undefined;
});

/** Gibt an, ob das eigene Profil angezeigt wird */
const isOwnProfile = computed(() => !viewedUsername.value);
const isAuthenticated = computed(() => authStore.isAuthenticated);

/** Benutzername für den Artikelabruf; eigener Benutzername als Fallback */
const profileUsername = computed(() =>
  viewedUsername.value ?? authStore.user?.username ?? ''
);

onMounted(async () => {
  try {
    if (isOwnProfile.value) {
      await fetchSubscriptions();
    }
    await fetchArticles({ author: profileUsername.value });
  } catch (err) {
    console.error('Failed to initialize profile:', err);
  }
});

/**
 * Lädt Abo und Artikel neu, wenn sich der angezeigte Benutzername ändert.
 */
watch(viewedUsername, async (next) => {
  if (!next) {
    await fetchSubscriptions();
  }
  await fetchArticles({ author: profileUsername.value });
});

/**
 * Beendet das Abo eines Autors und aktualisiert die Subscriptionliste.
 *
 * @param username Benutzername des zu entfolgenden Autors
 */
async function handleUnsubscribe(username: string) {
  await unsubscribeFromAuthor(username);
  await fetchSubscriptions();
}

/**
 * Schaltet den Like-Status eines Artikels um.
 * Tut nichts, wenn der Nutzer nicht eingeloggt ist.
 *
 * @param article Der zu liken oder zu entliken Artikel
 */
async function toggleArticleFavorite(article: Article) {
  if (!isAuthenticated.value) return;
  try {
    await toggleFavoriteData(article);
  } catch { }
}
</script>
