/**
 * libs/model/articleQuery.model.ts
 *
 * Zod Schemas und TypeScript Typen für Query Parameter der Artikel Endpunkte.
 * Unterscheidet zwischen dem globalen Feed (mit Filteroptionen) und
 * dem personalisierten Nutzer Feed (nur Paginierung).
 */

import z from 'zod';

/**
 * Schema für die Query Parameter des globalen Artikel Feeds (`GET /articles`).
 * Alle Felder sind optional.
 *
 * @param author   Filtert Artikel nach dem Benutzernamen des Autors
 * @param tag      Filtert Artikel nach einem bestimmten Tag
 * @param favorited Filtert Artikel, die von einem bestimmten Nutzer favorisiert wurden
 * @param limit    Maximale Anzahl zurückgegebener Artikel
 * @param offset   Anzahl zu überspringender Artikel (für Paginierung)
 */
export const ArticlesQueryDtoSchema = z.object({
  author: z.string().optional(),
  tag: z.string().optional(),
  favorited: z.string().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

/**
 * Schema für die Query Parameter des personalisierten Feeds (`GET /articles/feed`).
 * Enthält nur Paginierungsoptionen mit sinnvollen Standardwerten.
 *
 * @param limit  Maximale Anzahl zurückgegebener Artikel (Standard: 20)
 * @param offset Anzahl zu überspringender Artikel (Standard: 0)
 */
export const ArticlesFeedQueryDtoSchema = z.object({
  limit: z.coerce.number().min(1).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type ArticlesFeedQueryDto = z.infer<typeof ArticlesFeedQueryDtoSchema>;
export type ArticlesQueryDto = z.infer<typeof ArticlesQueryDtoSchema>;
