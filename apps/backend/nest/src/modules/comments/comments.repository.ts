/**
 * comments.repository.ts
 *
 * Datenbankzugriffsschicht für Kommentare.
 * Kapselt alle Prisma Abfragen rund um das Comment Modell und stellt
 * typsichere Methoden für CRUD Operationen bereit. Die Rohdaten werden
 * vor der Rückgabe stets in ein validiertes `CommentResponseDto` transformiert.
 */

import {
  CommentResponseDto,
  CommentResponseDtoSchema,
  CommentsResponseDto,
} from '@common/model';
import { Injectable } from '@nestjs/common';
import { DBService } from '@common/database';

@Injectable()
export class CommentsRepository {
  constructor(private readonly db: DBService) { }

  /**
   * Gibt den Prisma Client zurück.
   */
  private get prisma() {
    return this.db.client;
  }

  /**
   * Wandelt ein rohes Prisma Comment Objekt in ein validiertes `CommentResponseDto` um.
   * Berechnet dabei `following` relativ zum aktuell eingeloggten Nutzer.
   *
   * @param comment Rohes Kommentar Objekt aus der Datenbank inklusive Autor Relation
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Validiertes `CommentResponseDto`
   */
  private toCommentResponseDto(
    comment: {
      id: number;
      body: string;
      createdAt: Date;
      updatedAt: Date;
      author: {
        username: string;
        bio: string | null;
        profileImage: string | null;
        subscribers: { subscriberId: number }[];
      };
    },
    currentUserId?: number,
  ): CommentResponseDto {
    return CommentResponseDtoSchema.parse({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,

      author: {
        username: comment.author.username,
        bio: comment.author.bio,
        image: comment.author.profileImage,
        following:
          currentUserId !== undefined &&
          comment.author.subscribers.some(
            (s) => s.subscriberId === currentUserId,
          ),
      },
    });
  }

  /**
   * Gibt alle Kommentare eines Artikels absteigend nach Erstellungsdatum zurück.
   *
   * @param articleId Primärschlüssel des Artikels
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Objekt mit `comments` Array
   */
  async findByArticleId(
    articleId: number,
    currentUserId?: number,
  ): Promise<CommentsResponseDto> {
    const comments = await this.prisma.comment.findMany({
      where: {
        articleId,
      },
      include: {
        author: {
          include: {
            subscribers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      comments: comments.map((comment) =>
        this.toCommentResponseDto(comment, currentUserId),
      ),
    };
  }

  /**
   * Legt einen neuen Kommentar zu einem Artikel an.
   *
   * @param articleId Primärschlüssel des zugehörigen Artikels
   * @param userId ID des Autors
   * @param body Textinhalt des Kommentars
   * @param currentUserId Optionale ID des eingeloggten Nutzers (für DTO Transformation)
   * @returns Das erstellte `CommentResponseDto`
   */
  async createComment(
    articleId: number,
    userId: number,
    body: string,
    currentUserId?: number,
  ): Promise<CommentResponseDto> {
    const comment = await this.prisma.comment.create({
      data: {
        body,
        articleId,
        authorId: userId,
      },
      include: {
        author: {
          include: {
            subscribers: true,
          },
        },
      },
    });

    return this.toCommentResponseDto(comment, currentUserId);
  }

  /**
   * Sucht einen Kommentar anhand seiner ID und gibt die rohe Prisma Entity zurück.
   * Wird verwendet, wenn die `authorId` für die Berechtigungsprüfung benötigt wird.
   *
   * @param commentId Primärschlüssel des Kommentars
   * @returns Die rohe Kommentar Entity inklusive Autor oder `null`
   */
  async findEntityById(commentId: number) {
    return this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: true,
      },
    });
  }

  /**
   * Löscht einen Kommentar anhand seiner ID.
   *
   * @param commentId Primärschlüssel des zu löschenden Kommentars
   */
  async deleteComment(commentId: number): Promise<void> {
    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
