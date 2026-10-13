/**
 * articles.service.ts
 *
 * Logik Schicht für Artikel.
 * Orchestriert die Datenbankzugriffe über das ArticleRepository und
 * implementiert Berechtigungsprüfungen (Autor Check bei Update/Delete)
 * sowie die Slug Generierung. Wirft NestJS Exceptions, die der Controller
 * direkt als HTTP Antworten ausliefert.
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ArticlesQueryDto,
  CreateArticleDto,
  UpdateArticleDto,
  ArticlesFeedQueryDto,
  ArticleResponseDto,
} from '@common/model';
import { ArticleRepository } from './articles.repository';
import { randomBytes } from 'crypto';

@Injectable()
export class ArticlesService {
  constructor(private readonly articleRepository: ArticleRepository) { }

  /**
   * Erstellt einen neuen Artikel für den angegebenen Autor.
   * Generiert dabei automatisch einen eindeutigen Slug aus dem Titel.
   *
   * @param dto Validierte Eingabedaten (title, description, body, tagList)
   * @param authorId ID des erstellenden Nutzers
   * @returns Das erstellte Artikel DTO
   */
  async createArticle(
    dto: CreateArticleDto,
    authorId: number,
  ): Promise<ArticleResponseDto> {
    const articleDbDto = {
      title: dto.title,
      description: dto.description,
      body: dto.body,
      tagList: dto.tagList,
      slug: this.generateSlug(dto.title),
      authorId,
    };

    return this.articleRepository.createArticle(articleDbDto, authorId);
  }

  /**
   * Gibt einen einzelnen Artikel anhand seines Slugs zurück.
   *
   * @param slug Eindeutiger Slug des Artikels
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Das gefundene Artikel DTO
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  async getArticleBySlug(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto> {
    const result = await this.articleRepository.findBySlug(slug, currentUserId);
    if (!result)
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });

    return result;
  }

  /**
   * Aktualisiert einen bestehenden Artikel.
   * Prüft, ob der Artikel existiert und ob der anfragende Nutzer der Autor ist.
   *
   * @param slug Slug des zu aktualisierenden Artikels
   * @param data Zu ändernde Felder (alle optional)
   * @param userId ID des anfragenden Nutzers
   * @returns Das aktualisierte Artikel DTO
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor ist
   */
  async updateArticle(
    slug: string,
    data: UpdateArticleDto,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    if (article.authorId !== userId) {
      throw new UnauthorizedException({ errors: { body: ['Not authorized'] } });
    }

    return this.articleRepository.updateArticle(article.id, data, userId);
  }

  /**
   * Löscht einen Artikel.
   * Prüft, ob der Artikel existiert und ob der anfragende Nutzer der Autor ist.
   *
   * @param slug Slug des zu löschenden Artikels
   * @param userId ID des anfragenden Nutzers
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor ist
   */
  async deleteArticle(slug: string, userId: number): Promise<void> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    if (article.authorId !== userId) {
      throw new UnauthorizedException({ errors: { body: ['Not authorized'] } });
    }

    await this.articleRepository.delete(article.id);
  }

  /**
   * Gibt eine gefilterte und paginierte Liste aller Artikel zurück (Global Feed).
   * Setzt fehlende Paginierungswerte auf ihre Standardwerte (offset=0, limit=20).
   *
   * @param query Filterparameter (author, tag, favorited, offset, limit)
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  async getArticlesGlobal(
    query: ArticlesQueryDto,
    currentUserId?: number,
  ): Promise<{
    articles: ArticleResponseDto[];
    articlesCount: number;
  }> {
    const resolvedQuery = {
      author: query.author,
      tag: query.tag,
      favorited: query.favorited,
      offset: query.offset ?? 0,
      limit: query.limit ?? 20,
    };

    return this.articleRepository.findArticlesGlobal(
      resolvedQuery,
      currentUserId,
    );
  }

  /**
   * Gibt den personalisierten Feed des eingeloggten Nutzers zurück.
   * Enthält nur Artikel von Autoren, denen der Nutzer folgt.
   *
   * @param userId ID des eingeloggten Nutzers
   * @param query Paginierungsparameter (offset, limit)
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  async getUserFeed(
    userId: number,
    query: ArticlesFeedQueryDto,
  ): Promise<{
    articles: ArticleResponseDto[];
    articlesCount: number;
  }> {
    const resolvedQuery = {
      offset: query.offset,
      limit: query.limit,
    };

    return this.articleRepository.getUserFeed(userId, resolvedQuery);
  }

  /**
   * Generiert einen URL freundlichen Slug aus einem Artikeltitel.
   * Hängt 6 zufällige Hex Bytes an, um Kollisionen zu vermeiden.
   *
   * @param title Originaltitel des Artikels
   * @returns Eindeutiger Slug im Format `<bereinigter-titel>-<hex-id>`
   */
  private generateSlug(title: string): string {
    const base =
      title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-') || 'article';

    const id = randomBytes(6).toString('hex');

    return `${base}-${id}`;
  }

  /**
   * Fügt einem Artikel einen Like von einem Nutzer hinzu.
   * Lädt den Artikel danach neu, um den aktuellen `favoritesCount` zurückzugeben.
   *
   * @param slug Slug des zu likenden Artikels
   * @param userId ID des eingeloggten Nutzers
   * @returns Das aktualisierte Artikel DTO
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   * @throws InternalServerErrorException wenn der Artikel nach dem Liken nicht mehr auffindbar ist
   */
  async favoriteArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    await this.articleRepository.favoriteArticle(article.id, userId);

    const result = await this.articleRepository.findBySlug(slug, userId);

    if (!result) {
      throw new InternalServerErrorException({
        errors: {
          body: ['Invariant violated: article disappeared'],
        },
      });
    }

    return result;
  }

  /**
   * Entfernt den Like eines Artikels für den eingeloggten Nutzer.
   * Lädt den Artikel danach neu, um den aktuellen `favoritesCount` zurückzugeben.
   *
   * @param slug Slug des zu entlikenden Artikels
   * @param userId ID des eingeloggten Nutzers
   * @returns Das aktualisierte Artikel DTO
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   * @throws InternalServerErrorException wenn der Artikel nach dem Entliken nicht mehr auffindbar ist
   */
  async unFavoriteArticle(
    slug: string,
    userId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    await this.articleRepository.unFavoriteArticle(article.id, userId);

    const result = await this.articleRepository.findBySlug(slug, userId);

    if (!result) {
      throw new InternalServerErrorException({
        errors: {
          body: ['Invariant violated: article disappeared'],
        },
      });
    }

    return result;
  }
}
