/**
 * articles.repository.ts
 *
 * Datenbankzugriffsschicht für Artikel.
 * Kapselt alle Prisma Abfragen rund um das Article Modell und stellt
 * typsichere Methoden für CRUD Operationen, Like-Status und
 * Feed Abfragen bereit. Die Rohdaten werden vor der Rückgabe 
 * in ein validiertes `ArticleResponseDto` transformiert.
 */

import { Injectable } from '@nestjs/common';
import { DBService } from '@common/database';
import {
  ArticleResponseDto,
  ArticleResponseDtoSchema,
  ArticlesFeedQueryDto,
  type ArticlesQueryDto,
  type CreateArticleDbDto,
} from '@common/model';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class ArticleRepository {
  constructor(private readonly db: DBService) { }

  /**
   * Gibt den Prisma Client zurück.
   */
  private get prisma() {
    return this.db.client;
  }

  /**
   * Wandelt ein rohes Prisma Article Objekt in ein validiertes `ArticleResponseDto` um.
   * Berechnet dabei `favorited` und `following` relativ zum aktuell eingeloggten Nutzer.
   *
   * @param article Rohes Artikel Objekt aus der Datenbank inklusive Relations
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Validiertes `ArticleResponseDto`
   */
  private toArticleResponseDto(
    article: {
      slug: string;
      title: string;
      description: string;
      body: string;
      createdAt: Date;
      updatedAt: Date;
      tags: { name: string }[];
      favorites: { userId: number }[];
      author: {
        username: string;
        bio: string | null;
        profileImage: string | null;
        subscribers: { subscriberId: number }[];
      };
    },
    currentUserId?: number,
  ): ArticleResponseDto {
    return ArticleResponseDtoSchema.parse({
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,

      tagList: article.tags.map((t) => t.name),

      createdAt: article.createdAt,
      updatedAt: article.updatedAt,

      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.profileImage,
        following:
          currentUserId !== undefined &&
          article.author.subscribers.some(
            (s) => s.subscriberId === currentUserId,
          ),
      },

      favoritesCount: article.favorites.length,

      favorited:
        currentUserId !== undefined &&
        article.favorites.some((f) => f.userId === currentUserId),
    });
  }

  /**
   * Sucht einen Artikel anhand seines Slugs und gibt ihn als DTO zurück.
   *
   * @param slug Eindeutiger Slug des Artikels
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Das gefundene `ArticleResponseDto` oder `undefined`
   */
  async findBySlug(
    slug: string,
    currentUserId?: number,
  ): Promise<ArticleResponseDto | undefined> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        tags: true,
        favorites: true,
        author: {
          include: {
            subscribers: true,
          },
        },
      },
    });

    if (!article) return undefined;

    return this.toArticleResponseDto(article, currentUserId);
  }

  /**
   * Sucht einen Artikel anhand seines Slugs und gibt die rohe Prisma Entity zurück.
   * Wird verwendet, wenn die `id` oder `authorId` des Artikels benötigt wird
   * (z. B. für Update oder Delete Operationen).
   *
   * @param slug Eindeutiger Slug des Artikels
   * @returns Die rohe Artikel Entity inklusive Relations oder `null`
   */
  async findEntityBySlug(slug: string) {
    return this.prisma.article.findUnique({
      where: {
        slug,
      },
      include: {
        tags: true,
        favorites: true,
        author: {
          include: {
            subscribers: true,
          },
        },
      },
    });
  }

  /**
   * Legt einen neuen Artikel in der Datenbank an.
   * Tags werden per `connectOrCreate` angelegt bzw. wiederverwendet.
   *
   * @param data Artikeldaten gemäß `CreateArticleDbDto` (inkl. generiertem Slug und authorId)
   * @param currentUserId ID des erstellenden Nutzers (für DTO Transformation)
   * @returns Das erstellte Artikel DTO
   */
  async createArticle(
    data: CreateArticleDbDto,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const article = await this.prisma.article.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        body: data.body,
        authorId: data.authorId,

        tags: {
          connectOrCreate: (data.tagList ?? []).map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: {
        tags: true,
        favorites: true,
        author: {
          include: {
            subscribers: true,
          },
        },
      },
    });

    return this.toArticleResponseDto(article, currentUserId);
  }

  /**
   * Aktualisiert einen bestehenden Artikel anhand seiner ID.
   * Bei Angabe einer neuen `tagList` werden alle bisherigen Tags ersetzt.
   *
   * @param id Primärschlüssel des Artikels
   * @param data Zu aktualisierende Felder (alle optional)
   * @param currentUserId ID des eingeloggten Nutzers (für DTO Transformation)
   * @returns Das aktualisierte Artikel DTO
   */
  async updateArticle(
    id: number,
    data: Partial<{
      slug: string;
      title: string;
      description: string;
      body: string;
      tagList: string[];
    }>,
    currentUserId: number,
  ): Promise<ArticleResponseDto> {
    const { tagList, ...rest } = data;

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...rest,
        ...(tagList !== undefined && {
          tags: {
            set: [],
            connectOrCreate: tagList.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        }),
      },
      include: {
        tags: true,
        favorites: true,
        author: {
          include: {
            subscribers: true,
          },
        },
      },
    });

    return this.toArticleResponseDto(article, currentUserId);
  }

  /**
   * Löscht einen Artikel anhand seiner ID.
   *
   * @param id Primärschlüssel des zu löschenden Artikels
   * @returns `true` bei Erfolg, `false` wenn der Artikel nicht gefunden wurde (P2025)
   * @throws Wirft alle anderen Prisma Fehler weiter
   */
  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.article.delete({
        where: { id },
      });

      return true;
    } catch (err) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Gibt eine gefilterte und paginierte Liste aller Artikel zurück (Global Feed).
   * Unterstützt Filterung nach Autor Username, Tag Name und favorisierendem Nutzer.
   * Verwendet eine Prisma Transaktion für konsistente Gesamtanzahl und Ergebnisliste.
   *
   * @param dto Filterparameter (author, tag, favorited, offset, limit)
   * @param currentUserId Optionale ID des eingeloggten Nutzers
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  async findArticlesGlobal(
    dto: ArticlesQueryDto,
    currentUserId?: number,
  ): Promise<{ articles: ArticleResponseDto[]; articlesCount: number }> {
    const where: any = {};

    if (dto.author) {
      where.author = {
        username: dto.author,
      };
    }

    if (dto.tag) {
      where.tags = {
        some: {
          name: dto.tag,
        },
      };
    }

    if (dto.favorited) {
      where.favorites = {
        some: {
          user: {
            username: dto.favorited,
          },
        },
      };
    }

    const [articlesCount, articles] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: {
          tags: true,
          favorites: true,
          author: {
            include: {
              subscribers: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: dto.offset,
        take: dto.limit,
      }),
    ]);

    return {
      articles: articles.map((article) =>
        this.toArticleResponseDto(article, currentUserId),
      ),
      articlesCount,
    };
  }

  /**
   * Gibt den personalisierten Feed eines Nutzers zurück.
   * Enthält nur Artikel von Autoren, denen der Nutzer folgt (Subscriber Relation).
   * Verwendet eine Prisma Transaktion für konsistente Gesamtanzahl und Ergebnisliste.
   *
   * @param userId ID des eingeloggten Nutzers
   * @param dto Paginierungsparameter (offset, limit)
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  async getUserFeed(
    userId: number,
    dto: ArticlesFeedQueryDto,
  ): Promise<{
    articles: ArticleResponseDto[];
    articlesCount: number;
  }> {
    const where = {
      author: {
        subscribers: {
          some: {
            subscriberId: userId,
          },
        },
      },
    };
    const [articlesCount, articles] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        include: {
          author: {
            include: {
              subscribers: true,
            },
          },
          tags: true,
          favorites: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: dto.offset,
        take: dto.limit,
      }),
    ]);

    return {
      articles: articles.map((article) =>
        this.toArticleResponseDto(article, userId),
      ),
      articlesCount,
    };
  }

  /**
   * Fügt einem Artikel einen Like von einem Nutzer hinzu.
   * Idempotent dank `upsert` ein bereits vorhandener Eintrag wird nicht dupliziert.
   *
   * @param articleId ID des zu likenden Artikels
   * @param userId ID des Nutzers
   */
  async favoriteArticle(articleId: number, userId: number): Promise<void> {
    await this.prisma.favorite.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {},
      create: {
        userId,
        articleId,
      },
    });
  }

  /**
   * Entfernt einem Artikel den Like eines Nutzers.
   * Idempotent wenn kein passender Eintrag existiert, passiert nichts.
   *
   * @param articleId ID des zu entlikenden Artikels
   * @param userId ID des Nutzers
   */
  async unFavoriteArticle(articleId: number, userId: number): Promise<void> {
    await this.prisma.favorite.deleteMany({
      where: {
        articleId,
        userId,
      },
    });
  }
}
