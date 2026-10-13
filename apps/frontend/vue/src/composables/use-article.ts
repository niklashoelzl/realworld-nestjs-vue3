/**
 * src/composables/use-article.ts
 *
 * Vue Composables für den Zugriff auf Artikel Daten.
 *
 * `useArticle` verwaltet einen einzelnen Artikel und stellt Methoden
 * für CRUD Operationen sowie Favorisierung bereit.
 *
 * `useArticleList` verwaltet eine Liste von Artikeln mit Paginierung
 * und unterstützt Favorisierung einzelner Listeneinträge.
 */

import { ref, type Ref } from 'vue';
import type { Article, ArticlesQuery, CreateArticleDto, UpdateArticleDto } from '@/services/articleService';
import { articleService } from '@/services/articleService';

interface UseArticleReturn {
    article: Ref<Article | null>;
    loading: Ref<boolean>;
    error: Ref<string>;

    fetchArticle: (slug: string) => Promise<void>;
    createArticle: (dto: CreateArticleDto) => Promise<Article>;
    updateArticle: (slug: string, dto: UpdateArticleDto) => Promise<Article>;
    deleteArticle: (slug: string) => Promise<void>;
    toggleFavorite: () => Promise<void>;
    clearError: () => void;
}

/**
 * Composable zur Verwaltung eines einzelnen Artikels.
 * Stellt reaktive Zustände (`article`, `loading`, `error`) sowie
 * Methoden für alle CRUD Operationen und die Favorisierung bereit.
 *
 * @returns Reaktive Zustände und Methoden für einen einzelnen Artikel
 */
export function useArticle(): UseArticleReturn {
    const article = ref<Article | null>(null);
    const loading = ref(false);
    const error = ref('');

    /**
     * Lädt einen Artikel anhand seines Slugs vom Backend.
     *
     * @param slug Slug des zu ladenden Artikels
     */
    async function fetchArticle(slug: string) {
        try {
            loading.value = true;
            error.value = '';
            article.value = await articleService.getArticleBySlug(slug);
        } catch (err: any) {
            error.value = err.message || 'Failed to load article';
            console.error('fetchArticle error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Erstellt einen neuen Artikel und setzt ihn als aktuellen Artikel.
     *
     * @param dto Artikeldaten
     * @returns Der erstellte Artikel
     */
    async function createArticle(dto: CreateArticleDto): Promise<Article> {
        try {
            loading.value = true;
            error.value = '';
            const created = await articleService.createArticle(dto);
            article.value = created;
            return created;
        } catch (err: any) {
            error.value = err.message || 'Failed to create article';
            console.error('createArticle error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Aktualisiert einen bestehenden Artikel und überschreibt den lokalen Zustand.
     *
     * @param slug Slug des zu aktualisierenden Artikels
     * @param dto Zu ändernde Felder
     * @returns Der aktualisierte Artikel
     */
    async function updateArticle(slug: string, dto: UpdateArticleDto): Promise<Article> {
        try {
            loading.value = true;
            error.value = '';
            const updated = await articleService.updateArticle(slug, dto);
            article.value = updated;
            return updated;
        } catch (err: any) {
            error.value = err.message || 'Failed to update article';
            console.error('updateArticle error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Löscht den aktuellen Artikel und setzt `article` auf `null`.
     *
     * @param slug Slug des zu löschenden Artikels
     */
    async function deleteArticle(slug: string): Promise<void> {
        try {
            loading.value = true;
            error.value = '';
            await articleService.deleteArticle(slug);
            article.value = null;
        } catch (err: any) {
            error.value = err.message || 'Failed to delete article';
            console.error('deleteArticle error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Schaltet den Favorisierungsstatus des aktuellen Artikels um.
     * Ist der Artikel bereits favorisiert, wird er entfavorisiert und umgekehrt.
     * Tut nichts, wenn kein Artikel geladen ist.
     */
    async function toggleFavorite() {
        if (!article.value) return;

        try {
            const updated = article.value.favorited
                ? await articleService.unfavoriteArticle(article.value.slug)
                : await articleService.favoriteArticle(article.value.slug);
            article.value = updated;
        } catch (err: any) {
            error.value = err.message || 'Failed to update favorite';
            console.error('toggleFavorite error:', err);
            throw err;
        }
    }

    /** Setzt den Fehlerzustand zurück */
    function clearError() {
        error.value = '';
    }

    return {
        article,
        loading,
        error,
        fetchArticle,
        createArticle,
        updateArticle,
        deleteArticle,
        toggleFavorite,
        clearError,
    };
}

interface UseArticleListReturn {
    articles: Ref<Article[]>;
    articlesCount: Ref<number>;
    loading: Ref<boolean>;
    error: Ref<string>;

    fetchArticles: (query?: ArticlesQuery) => Promise<void>;
    toggleFavorite: (targetArticle: Article) => Promise<void>;
}

/**
 * Composable zur Verwaltung einer Artikelliste.
 * Unterstützt optionale Filterung und Paginierung sowie
 * das Umschalten des Favorisierungsstatus einzelner Artikel.
 *
 * @returns Reaktive Zustände und Methoden für eine Artikelliste
 */
export function useArticleList(): UseArticleListReturn {
    const articles = ref<Article[]>([]);
    const articlesCount = ref(0);
    const loading = ref(false);
    const error = ref('');

    /**
     * Lädt eine Liste von Artikeln mit optionalen Filterparametern vom Backend.
     *
     * @param query Optionale Filterparameter (Tag, Autor, Favoriten, Paginierung)
     */
    async function fetchArticles(query: ArticlesQuery = {}) {
        try {
            loading.value = true;
            error.value = '';
            const result = await articleService.getArticles(query);
            articles.value = result.articles;
            articlesCount.value = result.articlesCount;
        } catch (err: any) {
            error.value = err.message || 'Failed to load articles';
            console.error('fetchArticles error:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * Schaltet den Favorisierungsstatus eines bestimmten Artikels in der Liste um.
     * Aktualisiert den Listeneintrag nach erfolgreicher API Antwort direkt im Array.
     *
     * @param targetArticle Der Artikel, dessen Favorisierungsstatus umgeschaltet werden soll
     */
    async function toggleFavorite(targetArticle: Article) {
        try {
            const updated = targetArticle.favorited
                ? await articleService.unfavoriteArticle(targetArticle.slug)
                : await articleService.favoriteArticle(targetArticle.slug);

            const index = articles.value.findIndex((a) => a.slug === updated.slug);
            if (index !== -1) {
                articles.value[index] = updated;
            }
        } catch (err: any) {
            error.value = err.message || 'Failed to update favorite';
            console.error('toggleFavorite error:', err);
            throw err;
        }
    }

    return {
        articles,
        articlesCount,
        loading,
        error,
        fetchArticles,
        toggleFavorite,
    };
}
