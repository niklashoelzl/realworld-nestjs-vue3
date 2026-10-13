/**
 * libs/model/index.ts
 *
 * Zentraler Einstiegspunkt des `model` Pakets.
 * Re-exportiert alle Schemas, Typen und Interfaces aus den einzelnen
 * Modell Dateien, sodass Konsumenten nur `@common/model` importieren müssen.
 *
 * Hinweis: `error.model` ist doppelt aufgeführt. Einer der beiden Einträge
 * kann entfernt werden.
 */

export * from './error.model';
export * from './article.model';
export * from './user.model';
export * from './articleQuery.model';
export * from './error.model';
export * from './comment.model';

/**
 * Vollständige Nutzerrepräsentation aus der Datenbank.
 * Wird als gemeinsamer Typ im Monorepo genutzt, z. B. für
 * JWT Payload Validierung und Request Anreicherung.
 *
 * @deprecated Verwende stattdessen das `User` Interface aus `user.model.ts`
 * um Dopplungen zu vermeiden.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  bio?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  created_at: string;
}
