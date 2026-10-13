<!--
HomeView.vue

Startseite der Applikation mit globalem + persönlichem Artikel Feed.

Nicht eingeloggte Nutzer sehen einen Hero Bereich mit Registrierungsaufforderung.
Eingeloggte Nutzer können zwischen "All Articles" (Global Feed) und
"Following" (Feed der abonnierten Autoren) wechseln.

Artikel können nach einem oder mehreren Tags gefiltert werden.
Die Tag Suche schlägt passende Tags aus der Backend Liste vor.
Für mehrere aktive Tags werden die Ergebnisse clientseitig zusammengeführt
und dedupliziert.
-->

<template>
  <div>
    <!-- Hero: nur wenn nicht eingeloggt -->
    <section v-if="!isAuthenticated" class="text-center py-16 px-4 border-b border-gray-800 mb-8">
      <h1 class="text-4xl font-bold tracking-tight mb-3">
        Share Ideas.<br />
        <span class="text-indigo-400">Discover Authors.</span>
      </h1>
      <p class="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
        Read articles from other authors or write your own stories.
      </p>
      <div class="flex items-center justify-center">
        <RouterLink to="/SignUp"
          class="rounded-md bg-indigo-500 px-5 py-2.5 font-semibold text-white hover:bg-indigo-400 transition-colors">
          Get Started
        </RouterLink>
      </div>
    </section>

    <!-- Feed Tabs + Schreiben Button -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex gap-1 bg-gray-800 rounded-lg p-1">
        <button @click="setFeed('global')"
          :class="['px-4 py-1.5 rounded-md text-sm font-semibold transition-colors', activeFeed === 'global' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white']">
          All Articles
        </button>
        <button v-if="isAuthenticated" @click="setFeed('following')"
          :class="['px-4 py-1.5 rounded-md text-sm font-semibold transition-colors', activeFeed === 'following' ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white']">
          Following
        </button>
      </div>

      <RouterLink v-if="isAuthenticated" to="/articles/new"
        class="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-400 transition-colors">
        <PenLine class="w-4 h-4" />
        Write Article
      </RouterLink>
    </div>

    <!-- Tag Suche -->
    <div class="relative mb-6 max-w-sm">
      <div v-if="activeTags.length > 0" class="flex gap-2 flex-wrap mb-2">
        <span v-for="tag in activeTags" :key="tag"
          class="flex items-center gap-1 bg-indigo-500 text-white rounded-full px-3 py-1 text-xs font-semibold">
          {{ tag }}
          <button @click="removeTag(tag)" class="hover:text-indigo-200 transition-colors">
            <X class="w-3 h-3" />
          </button>
        </span>
      </div>

      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input v-model="tagSearch" type="text" placeholder="Filter by Tag"
          class="w-full rounded-md bg-gray-800 border border-gray-700 pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
      </div>

      <!-- Dropdown -->
      <div v-if="filteredTags.length > 0"
        class="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
        <button v-for="tag in filteredTags" :key="tag" @mousedown.prevent="addTag(tag)"
          class="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
          {{ tag }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-md bg-red-500/10 border border-red-500/20 p-3 mb-6">
      <p class="text-sm text-red-400">{{ error }}</p>
    </div>

    <!-- Loading -->
    <div v-if="loading && articles.length === 0" class="text-center py-16 text-gray-500">
      <span class="animate-pulse">Loading articles…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!loading && articles.length === 0" class="text-center py-16">
      <p class="text-gray-500">No articles found.</p>
      <RouterLink v-if="isAuthenticated" to="/articles/new"
        class="mt-4 inline-block text-sm text-indigo-400 hover:underline">
        Write the first article
      </RouterLink>
    </div>

    <!-- Liste -->
    <ul v-else class="space-y-4">
      <li v-for="article in articles" :key="article.slug">
        <RouterLink :to="`/articles/${article.slug}`"
          class="block rounded-lg border border-gray-800 bg-gray-800/40 p-5 hover:border-indigo-500 hover:bg-gray-800/60 transition-colors cursor-pointer">
          <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span @click.prevent.stop="$router.push(`/profile/${article.author.username}`)"
              class="hover:text-indigo-400 transition-colors cursor-pointer">
              {{ article.author.username }}
            </span>
            <span>{{ new Date(article.createdAt).toLocaleDateString('de-DE') }}</span>
          </div>
          <h3 class="text-base font-semibold text-white mb-1">{{ article.title }}</h3>
          <p class="text-sm text-gray-400 line-clamp-2">{{ article.description }}</p>
          <p class="text-sm text-gray-500 line-clamp-2 italic whitespace-pre-line">{{ excerpt(article.body) }}</p>
          <div class="flex items-center justify-between mt-4">
            <div class="flex flex-wrap gap-1.5">
              <span v-for="tag in article.tagList" :key="tag"
                class="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full px-2.5 py-1 text-xs font-medium">
                <Tag class="w-3 h-3" />
                {{ tag }}
              </span>
            </div>
            <button @click.prevent.stop="toggleFavorite(article)" :disabled="!isAuthenticated"
              :class="['flex items-center gap-1 text-sm transition-colors', article.favorited ? 'text-red-400' : 'text-gray-600 hover:text-red-400', !isAuthenticated && 'cursor-default']">
              <Heart class="w-4 h-4" :fill="article.favorited ? 'currentColor' : 'none'" />
              {{ article.favoritesCount }}
            </button>
          </div>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Heart, PenLine, Search, Tag, X } from 'lucide-vue-next';
import { useArticleList } from '@/composables/use-article';
import { useAuthStore } from '@/stores/authStore';
import { tagService } from '@/services/tagService';
import type { Article } from '@/services/articleService';
import { articleService } from '@/services/articleService';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const { articles, loading, error, fetchArticles, toggleFavorite: toggleFavoriteData } = useArticleList();

const activeFeed = ref<'global' | 'following'>('global');
const activeTags = ref<string[]>([]);
const tags = ref<string[]>([]);
const tagSearch = ref('');

/**
 * Gefilterte Tag Vorschläge für die Dropdown Suche.
 * Zeigt nur Tags an, die noch nicht aktiv sind und den Suchbegriff enthalten.
 * Gibt ein leeres Array zurück, wenn das Suchfeld leer ist.
 */
const filteredTags = computed(() => {
  const q = tagSearch.value.trim().toLowerCase();
  const available = tags.value.filter(t => !activeTags.value.includes(t));
  if (!q) return [];
  return available.filter(t => t.toLowerCase().includes(q));
});

onMounted(async () => {
  await loadFeed();
  try {
    tags.value = await tagService.getTags();
  } catch { }
});

/**
 * Lädt den aktiven Feed vom Backend.
 * Im "following" Modus wird der personalisierte Feed geladen und clientseitig
 * nach aktiven Tags gefiltert.
 * Im "global" Modus werden Artikel nach dem ersten aktiven Tag abgerufen;
 * für weitere Tags werden die Ergebnisse zusammengeführt und dedupliziert.
 */
async function loadFeed() {
  if (activeFeed.value === 'following' && isAuthenticated.value) {
    try {
      loading.value = true;
      error.value = '';
      const result = await articleService.getFeed();
      articles.value = activeTags.value.length > 0
        ? result.articles.filter(a => activeTags.value.some(tag => a.tagList.includes(tag)))
        : result.articles;
    } catch (err: any) {
      error.value = err.message || 'Fehler beim Laden';
    } finally {
      loading.value = false;
    }
  } else {
    const primaryTag = activeTags.value[0] ?? undefined;
    await fetchArticles(primaryTag ? { tag: primaryTag } : {});
    if (activeTags.value.length > 1) {
      const extraResults = await Promise.all(
        activeTags.value.slice(1).map(tag => articleService.getArticles({ tag }))
      );
      const extraArticles = extraResults.flatMap(r => r.articles);
      const allSlugs = new Set(articles.value.map(a => a.slug));
      for (const article of extraArticles) {
        if (!allSlugs.has(article.slug)) {
          articles.value.push(article);
          allSlugs.add(article.slug);
        }
      }
    }
  }
}

/**
 * Wechselt den aktiven Feed und lädt die Artikel neu.
 *
 * @param feed Ziel Feed (`global` oder `following`)
 */
async function setFeed(feed: 'global' | 'following') {
  activeFeed.value = feed;
  await loadFeed();
}

/**
 * Fügt einen Tag zur aktiven Filterliste hinzu und lädt den Feed neu.
 * Bereits aktive Tags werden ignoriert.
 *
 * @param tag Der hinzuzufügende Tag
 */
function addTag(tag: string) {
  if (!activeTags.value.includes(tag)) {
    activeTags.value.push(tag);
    tagSearch.value = '';
    void loadFeed();
  }
}

/**
 * Entfernt einen Tag aus der aktiven Filterliste und lädt den Feed neu.
 *
 * @param tag Der zu entfernende Tag
 */
function removeTag(tag: string) {
  activeTags.value = activeTags.value.filter(t => t !== tag);
  void loadFeed();
}

/**
 * Schaltet den Like-Status eines Artikels um.
 * Tut nichts, wenn der Nutzer nicht eingeloggt ist.
 *
 * @param article Der zu liken oder zu entliken Artikel
 */
async function toggleFavorite(article: Article) {
  if (!isAuthenticated.value) return;
  try {
    await toggleFavoriteData(article);
  } catch { }
}

/**
 * Kürzt einen Artikeltext auf die angegebene Maximallänge.
 * Mehrfache Leerzeichen und Tabs werden normalisiert.
 *
 * @param text Zu kürzender Text
 * @param maxLength Maximale Zeichenanzahl (Standard: 200)
 * @returns Gekürzter Text mit Ellipsis, oder Originaltext wenn kürzer als `maxLength`
 */
function excerpt(text: string, maxLength = 200): string {
  const clean = text.replace(/[ \t]+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '…';
}
</script>
