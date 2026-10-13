/**
 * src/services/commentService.ts
 *
 * Service für alle Kommentar bezogenen API Aufrufe.
 * Kapselt die Kommunikation mit dem Backend Endpunkt `/articles/:slug/comments`.
 * Das JWT Token wird automatisch aus dem `authStore` bezogen.
 */

import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/services/userService';

/** Vollständige Kommentarrepräsentation aus der API Antwort */
export interface Comment {
    id: number;
    body: string;
    createdAt: string;
    updatedAt: string;
    author: Profile;
}

export interface CommentsResponse {
    comments: Comment[];
}

/** Pflichtfelder für die Erstellung eines neuen Kommentars */
export interface CreateCommentDto {
    body: string;
}

class CommentService {
    private apiUrl = import.meta.env.VITE_API_URL;

    /**
     * Gibt die Basis URL für Kommentare eines bestimmten Artikels zurück.
     *
     * @param slug Slug des zugehörigen Artikels
     */
    private baseUrl(slug: string) {
        return `${this.apiUrl}/articles/${slug}/comments`;
    }

    /**
     * Liest den Response Body sicher als JSON aus.
     * Gibt ein leeres Objekt zurück wenn der Body leer ist,
     * und `{ message: text }` bei ungültigem JSON.
     *
     * @param response Der HTTP Response
     */
    private async parseJsonSafe(response: Response): Promise<any> {
        const text = await response.text();
        if (!text) return {};
        try {
            return JSON.parse(text);
        } catch {
            return { message: text };
        }
    }

    /**
     * Gibt die benötigten Request Header zurück, inklusive JWT Token falls vorhanden.
     * Wirft einen Fehler, wenn `required` true ist aber kein Token im Store vorliegt.
     *
     * @param required Gibt an, ob ein Token zwingend erforderlich ist (Standard: true)
     */
    private authHeaders(required = true): HeadersInit {
        const authStore = useAuthStore();

        if (required && !authStore.token) {
            throw new Error('No authentication token found');
        }

        return {
            ...(authStore.token ? { Authorization: `Token ${authStore.token}` } : {}),
            'Content-Type': 'application/json',
        };
    }

    /**
     * Gibt alle Kommentare eines Artikels zurück.
     * Auth optional.
     * GET /articles/:slug/comments
     *
     * @param slug Slug des Artikels
     */
    async getComments(slug: string): Promise<Comment[]> {
        const response = await fetch(this.baseUrl(slug), {
            method: 'GET',
            headers: this.authHeaders(false),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to fetch comments');
        }

        const data = await response.json();
        return data.comments;
    }

    /**
     * Erstellt einen neuen Kommentar zu einem Artikel.
     * Auth erforderlich.
     * POST /articles/:slug/comments, Body: { comment: CreateCommentDto }
     *
     * @param slug Slug des Artikels
     * @param dto Kommentardaten
     */
    async createComment(slug: string, dto: CreateCommentDto): Promise<Comment> {
        const response = await fetch(this.baseUrl(slug), {
            method: 'POST',
            headers: this.authHeaders(true),
            body: JSON.stringify({ comment: dto }),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to create comment');
        }

        const data = await response.json();
        return data.comment;
    }

    /**
     * Löscht einen Kommentar anhand seiner ID.
     * Auth erforderlich.
     * DELETE /articles/:slug/comments/:id
     *
     * @param slug Slug des zugehörigen Artikels
     * @param id ID des zu löschenden Kommentars
     */
    async deleteComment(slug: string, id: number): Promise<void> {
        const response = await fetch(`${this.baseUrl(slug)}/${id}`, {
            method: 'DELETE',
            headers: this.authHeaders(true),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to delete comment');
        }
    }
}

export const commentService = new CommentService();
