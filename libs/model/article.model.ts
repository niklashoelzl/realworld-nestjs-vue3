/**
 * libs/model/article.model.ts
 *
 * Zod Schemas und TypeScript Typen für Artikel Daten.
 * Definiert sowohl die vollständige Datenbankrepräsentation eines Artikels
 * als auch die DTOs für die Erstellung, Aktualisierung und API Antwort.
 */

import { z } from 'zod';
import { ProfileDtoSchema } from './user.model';

/**
 * Vollständiges Schema eines Artikels, wie er in der Datenbank vorliegt.
 * Enthält alle Felder inklusive IDs, Zeitstempel und Tag Liste.
 */
export const ArticleDtoSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
  tagList: z.array(z.string()).default([]),
  slug: z.string(),
  authorId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Schema für die Erstellung eines neuen Artikels durch den Client.
 * Lässt serverseitig generierte Felder (id, slug, authorId, Zeitstempel) weg.
 */
export const CreateArticleDtoSchema = ArticleDtoSchema.omit({
  id: true,
  slug: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema für die Datenbank Schreiboperation beim Erstellen eines Artikels.
 * Enthält slug und authorId, aber noch keine automatisch gesetzten Zeitstempel.
 */
export const CreateArticleDbDtoSchema = ArticleDtoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema für die partielle Aktualisierung eines bestehenden Artikels.
 * Alle Felder sind optional. Nur die übermittelten Felder werden geändert.
 */
export const UpdateArticleDtoSchema = CreateArticleDtoSchema.pick({
  title: true,
  description: true,
  body: true,
  tagList: true,
}).partial();

/**
 * Schema für die API Antwort eines einzelnen Artikels.
 * Enthält das eingebettete Autorprofil sowie Like Informationen.
 */
export const ArticleResponseDtoSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  body: z.string(),

  tagList: z.array(z.string()),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  /** Eingebettetes Profil des Artikelautors */
  author: ProfileDtoSchema,

  /** Gesamtzahl der Nutzer, die den Artikel geliked haben */
  favoritesCount: z.number(),

  /** Gibt an, ob der anfragende Nutzer den Artikel geliked hat */
  favorited: z.boolean(),
});

export type ArticleResponseDto = z.infer<typeof ArticleResponseDtoSchema>;

export type UpdateArticleDto = z.infer<typeof UpdateArticleDtoSchema>;

export type CreateArticleDbDto = z.infer<typeof CreateArticleDbDtoSchema>;

export type CreateArticleDto = z.infer<typeof CreateArticleDtoSchema>;
export type ArticleDto = z.infer<typeof ArticleDtoSchema>;
