/**
 * comments.service.ts
 *
 * Logik Schicht für Kommentare.
 * Löst Artikel per Slug auf, prüft Berechtigungen beim Löschen
 * und delegiert die Datenbankzugriffe an das CommentsRepository.
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommentsRepository } from './comments.repository';
import { ArticleRepository } from '../articles/articles.repository';
import {
  CommentResponseDto,
  CommentsResponseDto,
  CreateCommentDto,
} from '@common/model';

@Injectable()
export class CommentsService {
  constructor(
    private readonly commentsRepository: CommentsRepository,
    private readonly articleRepository: ArticleRepository,
  ) {}

  /**
   * Gibt alle Kommentare eines Artikels zurück.
   *
   * @param slug Slug des zugehörigen Artikels
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Objekt mit `comments` Array
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  async getComments(
    slug: string,
    currentUserId?: number,
  ): Promise<CommentsResponseDto> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    return this.commentsRepository.findByArticleId(article.id, currentUserId);
  }

  /**
   * Erstellt einen neuen Kommentar zu einem Artikel.
   *
   * @param slug Slug des zugehörigen Artikels
   * @param dto Validierte Kommentar Daten (body)
   * @param userId ID des eingeloggten Nutzers
   * @returns Das erstellte `CommentResponseDto`
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  async createComment(
    slug: string,
    dto: CreateCommentDto,
    userId: number,
  ): Promise<CommentResponseDto> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    return this.commentsRepository.createComment(
      article.id,
      userId,
      dto.body,
      userId,
    );
  }

  /**
   * Löscht einen Kommentar.
   * Prüft ob der Artikel und Kommentar existieren und ob der
   * anfragende Nutzer der Autor des Kommentars ist.
   *
   * @param slug Slug des zugehörigen Artikels
   * @param commentId ID des zu löschenden Kommentars
   * @param userId ID des anfragenden Nutzers
   * @throws NotFoundException wenn Artikel oder Kommentar nicht gefunden wurden
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor des Kommentars ist
   */
  async deleteComment(
    slug: string,
    commentId: number,
    userId: number,
  ): Promise<void> {
    const article = await this.articleRepository.findEntityBySlug(slug);

    if (!article) {
      throw new NotFoundException({
        errors: {
          body: [`Article with slug ${slug} not found`],
        },
      });
    }

    const comment = await this.commentsRepository.findEntityById(commentId);

    if (!comment) {
      throw new NotFoundException({
        errors: {
          body: [`Comment with id: ${commentId} not found`],
        },
      });
    }

    if (comment.authorId !== userId) {
      throw new UnauthorizedException({ errors: { body: ['Not authorized'] } });
    }

    await this.commentsRepository.deleteComment(commentId);
  }
}
