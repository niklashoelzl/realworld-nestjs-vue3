<!--
ArticleDetailView.vue

Detailansicht eines einzelnen Artikels.
Lädt den Artikel anhand des URL Slugs und zeigt Titel, Autor, Datum,
Tags, Beschreibung und Volltext an.

Eingeloggte Nutzer können den Artikel liken.
Der Autor des Artikels sieht zusätzlich Edit und Delete Buttons.
Das Löschen wird durch ein Bestätigungs Modal abgesichert.

Die `CommentSection` wird per Template Ref eingebunden;
`fetchComments` wird nach dem Artikelladen explizit aufgerufen.
-->

<template>
  <main class="max-w-3xl mx-auto p-8">
    <RouterLink to="/"
      class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6">
      <ArrowLeft class="w-4 h-4" />
      Back
    </RouterLink>

    <div v-if="loading && !article" class="text-center py-8 text-gray-500">Loading article...</div>

    <div v-else-if="error && !article" class="rounded-md bg-red-500/10 border border-red-500/20 p-3 my-4">
      <p class="text-sm text-red-400">{{ error }}</p>
    </div>

    <article v-else-if="article">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-3xl font-bold">{{ article.title }}</h1>
        <div v-if="isOwnArticle" class="flex gap-2 shrink-0 ml-4">
          <RouterLink :to="`/articles/${article.slug}/edit`"
            class="rounded-md bg-gray-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-600">
            Edit
          </RouterLink>
          <button @click="handleDelete" :disabled="deleting"
            class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-4 text-gray-600 text-sm mb-4">
        <RouterLink :to="`/profile/${article.author.username}`" class="hover:underline font-medium">
          {{ article.author.username }}
        </RouterLink>
        <span>{{ new Date(article.createdAt).toLocaleDateString() }}</span>
        <button @click="handleToggleFavorite" :disabled="!isAuthenticated"
          :class="['flex items-center gap-1 transition-colors', article.favorited ? 'text-red-500' : 'text-gray-500 hover:text-red-400']"
          :title="isAuthenticated ? (article.favorited ? 'Unfavorite' : 'Favorite') : 'Login required'">
          <Heart class="w-4 h-4" :fill="article.favorited ? 'currentColor' : 'none'" />
          {{ article.favoritesCount }}
        </button>
      </div>

      <div v-if="article.tagList.length > 0" class="flex flex-wrap gap-1.5 mb-4">
        <span v-for="tag in article.tagList" :key="tag"
          class="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full px-2.5 py-1 text-xs font-medium">
          <Tag class="w-3 h-3" />
          {{ tag }}
        </span>
      </div>

      <p class="font-bold mb-4">{{ article.description }}</p>
      <p class="whitespace-pre-wrap">{{ article.body }}</p>

      <CommentSection :slug="slug" ref="commentSectionRef" />

      <!-- Confirm Delete Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-sm shadow-xl">
          <h3 class="text-white font-semibold mb-2">Delete Article</h3>
          <p class="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
          <div class="flex justify-end gap-3">
            <button @click="showDeleteModal = false"
              class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors">
              Cancel
            </button>
            <button @click="confirmDelete" :disabled="deleting"
              class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors">
              {{ deleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </article>

    <p v-else>Article not found.</p>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useArticle } from '@/composables/use-article';
import { useAuthStore } from '@/stores/authStore';
import CommentSection from '@/components/article/CommentSection.vue';
import { Heart, ArrowLeft, Tag } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const slug = route.params.slug as string;
const commentSectionRef = ref<InstanceType<typeof CommentSection> | null>(null);

const { article, loading, error, fetchArticle, deleteArticle, toggleFavorite } = useArticle();

const deleting = ref(false);
const isAuthenticated = computed(() => authStore.isAuthenticated);

/** Gibt an, ob der eingeloggte Nutzer der Autor des aktuellen Artikels ist */
const isOwnArticle = computed(() => !!article.value && article.value.author.username === authStore.user?.username);

onMounted(async () => {
  await fetchArticle(slug);
  void commentSectionRef.value?.fetchComments(slug);
});

/**
 * Schaltet den Like-Status des Artikels um.
 * Tut nichts, wenn der Nutzer nicht eingeloggt ist.
 */
async function handleToggleFavorite() {
  if (!isAuthenticated.value) return;
  try {
    await toggleFavorite();
  } catch { }
}

const showDeleteModal = ref(false);

/** Öffnet das Bestätigungs Modal für das Löschen des Artikels */
function handleDelete() {
  showDeleteModal.value = true;
}

/**
 * Löscht den Artikel nach Bestätigung und leitet zur Startseite weiter.
 * Schließt das Modal und setzt `deleting` zurück, wenn ein Fehler auftritt.
 */
async function confirmDelete() {
  try {
    deleting.value = true;
    await deleteArticle(slug);
    await router.push('/');
  } catch {
    deleting.value = false;
    showDeleteModal.value = false;
  }
}
</script>
