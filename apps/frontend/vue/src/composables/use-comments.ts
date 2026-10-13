/**
 * src/composables/use-comments.ts
 *
 * Vue Composable zur Verwaltung von Kommentaren eines Artikels.
 * Stellt reaktive Zustände sowie Methoden zum Laden, Erstellen
 * und Löschen von Kommentaren bereit.
 */

import { ref, type Ref } from 'vue';
import type { Comment, CreateCommentDto } from '@/services/commentService';
import { commentService } from '@/services/commentService';

interface UseCommentsReturn {
    comments: Ref<Comment[]>;
    loading: Ref<boolean>;
    error: Ref<string>;

    fetchComments: (slug: string) => Promise<void>;
    addComment: (slug: string, dto: CreateCommentDto) => Promise<void>;
    removeComment: (slug: string, id: number) => Promise<void>;
}

/**
 * Composable zur Verwaltung der Kommentare eines Artikels.
 *
 * @returns Reaktive Zustände und Methoden für Kommentare
 */
export function useComments(): UseCommentsReturn {
    const comments = ref<Comment[]>([]);
    const loading = ref(false);
    const error = ref('');

    /**
     * Lädt alle Kommentare eines Artikels vom Backend.
     *
     * @param slug Slug des Artikels
     */
    async function fetchComments(slug: string) {
        try {
            loading.value = true;
            error.value = '';
            comments.value = await commentService.getComments(slug);
        } catch (err: any) {
            error.value = err.message || 'Failed to load comments';
            console.error('fetchComments error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Erstellt einen neuen Kommentar und fügt ihn lokal an die Kommentarliste an.
     *
     * @param slug Slug des Artikels
     * @param dto Kommentardaten
     */
    async function addComment(slug: string, dto: CreateCommentDto) {
        try {
            loading.value = true;
            error.value = '';
            const created = await commentService.createComment(slug, dto);
            comments.value.push(created);
        } catch (err: any) {
            error.value = err.message || 'Failed to add comment';
            console.error('addComment error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Löscht einen Kommentar und entfernt ihn aus der lokalen Liste.
     *
     * @param slug Slug des zugehörigen Artikels
     * @param id ID des zu löschenden Kommentars
     */
    async function removeComment(slug: string, id: number) {
        try {
            loading.value = true;
            error.value = '';
            await commentService.deleteComment(slug, id);
            comments.value = comments.value.filter((c) => c.id !== id);
        } catch (err: any) {
            error.value = err.message || 'Failed to delete comment';
            console.error('removeComment error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        comments,
        loading,
        error,
        fetchComments,
        addComment,
        removeComment,
    };
}
