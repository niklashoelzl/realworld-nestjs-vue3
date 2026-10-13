/**
 * libs/model/comment.model.ts
 *
 * Zod Schemas und TypeScript Typen für Kommentar Daten.
 * Deckt die vollständige Datenbankrepräsentation sowie die DTOs
 * für Erstellung, Datenbankschreibzugriff und API Antworten ab.
 */

import { z } from 'zod';
import { ProfileDtoSchema } from './user.model';

/**
 * Vollständiges Schema eines Kommentars, wie er in der Datenbank vorliegt.
 * Enthält alle Felder inklusive Fremdschlüssel und Zeitstempel.
 */
export const CommentDtoSchema = z.object({
  id: z.number(),
  body: z.string().min(1),

  /** Fremdschlüssel des zugehörigen Artikels */
  articleId: z.number(),

  /** Fremdschlüssel des Verfassers */
  authorId: z.number(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Schema für die Erstellung eines neuen Kommentars durch den Client.
 * Lässt serverseitig gesetzte Felder (id, articleId, authorId, Zeitstempel) weg.
 */
export const CreateCommentDtoSchema = CommentDtoSchema.omit({
  id: true,
  articleId: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema für die Datenbank Schreiboperation beim Erstellen eines Kommentars.
 * Enthält articleId und authorId, aber noch keine automatisch gesetzten Zeitstempel.
 */
export const CreateCommentDbDtoSchema = CommentDtoSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/**
 * Schema für die API Antwort eines einzelnen Kommentars.
 * Enthält das eingebettete Autorprofil anstelle der rohen authorId.
 */
export const CommentResponseDtoSchema = z.object({
  id: z.number(),

  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),

  body: z.string(),

  /** Eingebettetes Profil des Kommentarautors */
  author: ProfileDtoSchema,
});

/**
 * Schema für die API Antwort einer Liste von Kommentaren.
 * Entspricht dem RealWorld Spec Format `{ comments: [...] }`.
 */
export const CommentsResponseDtoSchema = z.object({
  comments: z.array(CommentResponseDtoSchema),
});

export type CommentDto = z.infer<typeof CommentDtoSchema>;
export type CreateCommentDto = z.infer<typeof CreateCommentDtoSchema>;
export type CreateCommentDbDto = z.infer<typeof CreateCommentDbDtoSchema>;
export type CommentResponseDto = z.infer<typeof CommentResponseDtoSchema>;
export type CommentsResponseDto = z.infer<typeof CommentsResponseDtoSchema>;
