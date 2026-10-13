<!--
CommentSection.vue

Zeigt die Kommentarliste eines Artikels an und ermöglicht
eingeloggten Nutzern das Verfassen und Löschen von Kommentaren.

Eigene Kommentare sind am Papierkorb Icon erkennbar und können
nach einer Bestätigungsabfrage im Modal gelöscht werden.

`fetchComments` wird per `defineExpose` nach außen freigegeben,
damit der Parent (ArticleDetailView) den initialen Ladevorgang steuern kann.

@prop slug Slug des Artikels, dessen Kommentare angezeigt werden
-->

<template>
    <section class="mt-10 border-t border-gray-300 pt-6">
        <h2 class="text-xl font-bold mb-4">Comments ({{ comments.length }})</h2>

        <!-- Add Comment Form -->
        <div v-if="isAuthenticated" class="mb-6">
            <textarea v-model="newCommentBody" rows="3" placeholder="Write a comment..."
                class="block w-full rounded-md border border-gray-300 px-3 py-2 placeholder:text-gray-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                :disabled="loading"></textarea>
            <div class="flex justify-end mt-2">
                <button @click="handleAddComment" :disabled="loading || !newCommentBody.trim()"
                    class="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:opacity-50">
                    Post Comment
                </button>
            </div>
        </div>
        <p v-else class="text-gray-500 text-sm mb-6">
            <RouterLink to="/login" class="text-indigo-500 hover:underline">Login</RouterLink> to leave a comment.
        </p>

        <!-- Comment List -->
        <div v-if="comments.length > 0" class="space-y-4">
            <div v-for="comment in comments" :key="comment.id" class="border border-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between mb-2">
                    <RouterLink :to="`/profile/${comment.author.username}`" class="flex items-center gap-2">
                        <!-- Avatar -->
                        <div
                            class="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center overflow-hidden shrink-0">
                            <img v-if="comment.author.image" :src="comment.author.image" :alt="comment.author.username"
                                class="w-full h-full object-cover">
                            <span v-else class="text-xs font-bold text-white">{{ (comment.author.username?.charAt(0)
                                || '?').toUpperCase() }}</span>
                        </div>
                        <span class="font-medium text-lg text-white hover:underline">{{ comment.author.username
                            }}</span>
                    </RouterLink>
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-gray-500">{{ new Date(comment.createdAt).toLocaleDateString('de-DE')
                        }}</span>
                        <button v-if="isOwnComment(comment)" @click="handleRemoveComment(comment.id)"
                            class="text-red-500 hover:text-red-400 transition-colors" title="Delete comment">
                            <Trash2 class="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <p class="text-sm text-gray-200 whitespace-pre-wrap">{{ comment.body }}</p>
            </div>
        </div>
        <p v-else class="text-gray-500 text-sm">No comments yet.</p>

        <!-- Confirm Delete Modal -->
        <div v-if="confirmDeleteId !== null" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-sm shadow-xl">
                <h3 class="text-white font-semibold mb-2">Delete comment?</h3>
                <p class="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
                <div class="flex justify-end gap-3">
                    <button @click="confirmDeleteId = null"
                        class="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors">
                        Cancel
                    </button>
                    <button @click="confirmDelete"
                        class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useComments } from '@/composables/use-comments';
import { useAuthStore } from '@/stores/authStore';
import type { Comment } from '@/services/commentService';
import { Trash2 } from 'lucide-vue-next';

const props = defineProps<{ slug: string }>();

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);
const { comments, loading, fetchComments, addComment, removeComment } = useComments();

const newCommentBody = ref('');

/** Gibt `fetchComments` für den Parent Mount Hook frei */
defineExpose({ fetchComments });

/**
 * Gibt an, ob der eingeloggte Nutzer der Autor des Kommentars ist.
 *
 * @param comment Der zu prüfende Kommentar
 */
function isOwnComment(comment: Comment): boolean {
    return comment.author.username === authStore.user?.username;
}

/**
 * Sendet den neuen Kommentar ab und leert das Eingabefeld bei Erfolg.
 * Tut nichts, wenn das Eingabefeld leer ist.
 */
async function handleAddComment() {
    const body = newCommentBody.value.trim();
    if (!body) return;
    try {
        await addComment(props.slug, { body });
        newCommentBody.value = '';
    } catch {
        // Fehler wird im Composable in error.value gehalten
    }
}

/** ID des Kommentars, dessen Löschung gerade bestätigt werden soll */
const confirmDeleteId = ref<number | null>(null);

/**
 * Öffnet das Bestätigungs Modal für das Löschen eines Kommentars.
 *
 * @param id ID des zu löschenden Kommentars
 */
async function handleRemoveComment(id: number) {
    confirmDeleteId.value = id;
}

/**
 * Führt das Löschen des Kommentars nach Bestätigung im Modal aus
 * und setzt die Modal ID anschließend zurück.
 */
async function confirmDelete() {
    if (confirmDeleteId.value === null) return;
    try {
        await removeComment(props.slug, confirmDeleteId.value);
    } catch {
        // Fehler wird im Composable in error.value gehalten
    } finally {
        confirmDeleteId.value = null;
    }
}
</script>
