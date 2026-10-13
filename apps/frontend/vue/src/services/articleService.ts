/**
 * src/services/articleService.ts
 *
 * Service für alle Artikel bezogenen API Aufrufe.
 * Kapselt die Kommunikation mit dem Backend-Endpunkt `/articles`
 * und stellt Methoden für CRUD Operationen sowie Favorisierung bereit.
 * Das JWT Token wird automatisch aus dem `authStore` bezogen.
 */

import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/services/userService';

/** Vollständige Artikelrepräsentation aus der API Antwort */
export interface Article {
    slug: string;
    title: string;
    description: string;
    body: string;
    tagList: string[];
    createdAt: string;
    updatedAt: string;
    favorited: boolean;
    favoritesCount: number;
    author: Profile;
}

/** API Antwort für Artikel Listen-Endpunkte */
export interface ArticlesResponse {
    articles: Article[];
    articlesCount: number;
}

/** Optionale Filterparameter für den globalen Artikel Feed */
export interface ArticlesQuery {
    tag?: string;
    author?: string;
    favorited?: string;
    offset?: number;
    limit?: number;
}

/** Pflichtfelder für die Erstellung eines neuen Artikels */
export interface CreateArticleDto {
    title: string;
    description: string;
    body: string;
    tagList?: string[];
}

/** Optionale Felder für die Aktualisierung eines bestehenden Artikels */
export interface UpdateArticleDto {
    title?: string;
    description?: string;
    body?: string;
    tagList?: string[];
}

class ArticleService {
    private apiUrl = import.meta.env.VITE_API_URL;
    private baseUrl = `${this.apiUrl}/articles`;

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
     * @param required Gibt an, ob ein Token erforderlich ist (Standard: true)
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
     * Baut einen Query String aus einem Objekt von Parametern.
     * Parameter mit dem Wert `undefined`, `null` oder leerem String werden ignoriert.
     *
     * @param query Objekt mit Query Parametern
     * @returns Query String inklusive führendem `?`, oder leerer String
     */
    private buildQueryParams(query: Record<string, string | number | undefined>): string {
        const params = new URLSearchParams();

        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        return queryString ? `?${queryString}` : '';
    }

    /**
     * Gibt eine Liste von Artikeln zurück (Global Feed).
     * Unterstützt optionale Filterung nach Tag, Autor und Favoriten sowie Paginierung.
     * Auth optional.
     * GET /articles
     *
     * @param query Optionale Filterparameter
     */
    async getArticles(query: ArticlesQuery = {}): Promise<ArticlesResponse> {
        const queryString = this.buildQueryParams({
            tag: query.tag,
            author: query.author,
            favorited: query.favorited,
            offset: query.offset,
            limit: query.limit,
        });

        const response = await fetch(`${this.baseUrl}${queryString}`, {
            method: 'GET',
            headers: this.authHeaders(false),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to fetch articles');
        }

        const data = await response.json();
        return { articles: data.articles, articlesCount: data.articlesCount };
    }

    /**
     * Gibt den personalisierten Feed des eingeloggten Nutzers zurück.
     * Enthält nur Artikel von Autoren, denen der Nutzer folgt.
     * Auth erforderlich.
     * GET /articles/feed
     *
     * @param query Optionale Paginierungsparameter
     */
    async getFeed(query: { offset?: number; limit?: number } = {}): Promise<ArticlesResponse> {
        const queryString = this.buildQueryParams({
            offset: query.offset,
            limit: query.limit,
        });

        const response = await fetch(`${this.baseUrl}/feed${queryString}`, {
            method: 'GET',
            headers: this.authHeaders(true),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to fetch feed');
        }

        const data = await response.json();
        return { articles: data.articles, articlesCount: data.articlesCount };
    }

    /**
     * Gibt einen einzelnen Artikel anhand seines Slugs zurück.
     * Auth optional.
     * GET /articles/:slug
     *
     * @param slug Slug des gesuchten Artikels
     */
    async getArticleBySlug(slug: string): Promise<Article> {
        const response = await fetch(`${this.baseUrl}/${slug}`, {
            method: 'GET',
            headers: this.authHeaders(false),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to fetch article');
        }

        const data = await response.json();
        return data.article;
    }

    /**
     * Erstellt einen neuen Artikel.
     * Auth erforderlich.
     * POST /articles, Body: { article: CreateArticleDto }
     *
     * @param dto Artikeldaten
     */
    async createArticle(dto: CreateArticleDto): Promise<Article> {
        const response = await fetch(`${this.baseUrl}`, {
            method: 'POST',
            headers: this.authHeaders(true),
            body: JSON.stringify({ article: dto }),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to create article');
        }

        const data = await response.json();
        return data.article;
    }

    /**
     * Aktualisiert einen bestehenden Artikel anhand seines Slugs.
     * Auth erforderlich.
     * PUT /articles/:slug, Body: { article: UpdateArticleDto }
     *
     * @param slug Slug des zu aktualisierenden Artikels
     * @param dto Zu ändernde Felder
     */
    async updateArticle(slug: string, dto: UpdateArticleDto): Promise<Article> {
        const response = await fetch(`${this.baseUrl}/${slug}`, {
            method: 'PUT',
            headers: this.authHeaders(true),
            body: JSON.stringify({ article: dto }),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to update article');
        }

        const data = await response.json();
        return data.article;
    }

    /**
     * Löscht einen Artikel anhand seines Slugs.
     * Auth erforderlich.
     * DELETE /articles/:slug
     *
     * @param slug Slug des zu löschenden Artikels
     */
    async deleteArticle(slug: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/${slug}`, {
            method: 'DELETE',
            headers: this.authHeaders(true),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to delete article');
        }
    }

    /**
     * Favorisiert einen Artikel für den eingeloggten Nutzer.
     * Auth erforderlich.
     * POST /articles/:slug/favorite
     *
     * @param slug Slug des zu favorisierenden Artikels
     * @returns Der aktualisierte Artikel mit erhöhtem `favoritesCount`
     */
    async favoriteArticle(slug: string): Promise<Article> {
        const response = await fetch(`${this.baseUrl}/${slug}/favorite`, {
            method: 'POST',
            headers: this.authHeaders(true),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to favorite article');
        }

        const data = await response.json();
        return data.article;
    }

    /**
     * Entfernt die Favorisierung eines Artikels für den eingeloggten Nutzer.
     * Auth erforderlich.
     * DELETE /articles/:slug/favorite
     *
     * @param slug Slug des zu entfavorisierenden Artikels
     * @returns Der aktualisierte Artikel mit verringertem `favoritesCount`
     */
    async unfavoriteArticle(slug: string): Promise<Article> {
        const response = await fetch(`${this.baseUrl}/${slug}/favorite`, {
            method: 'DELETE',
            headers: this.authHeaders(true),
        });

        if (!response.ok) {
            const error = await this.parseJsonSafe(response);
            throw new Error(error.message || 'Failed to unfavorite article');
        }

        const data = await response.json();
        return data.article;
    }
}

export const articleService = new ArticleService();
