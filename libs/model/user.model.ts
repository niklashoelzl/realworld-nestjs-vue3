/**
 * libs/model/user.model.ts
 *
 * Zod Schemas, TypeScript Typen und Interfaces für nutzerbezogene Daten.
 * Enthält Schemas für die Registrierung, den Login sowie
 * das Nutzerprofil für API Antworten.
 */

import { z } from 'zod';

/**
 * Schema für die Registrierung eines neuen Nutzers.
 * Validiert E-Mail Format, Mindestlänge des Benutzernamens (3 Zeichen)
 * und Mindestlänge des Passworts (8 Zeichen).
 */
export const RegisterDtoSchema = z.object({
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Schema für den Login eines bestehenden Nutzers.
 * Erfordert eine gültige E-Mail Adresse und ein nicht leeres Passwort.
 */
export const LoginDtoSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterDto = z.infer<typeof RegisterDtoSchema>;
export type LoginDto = z.infer<typeof LoginDtoSchema>;

/**
 * TypeScript Interface für die vollständige Nutzerrepräsentation
 * aus der Datenbank. Wird intern in Services und Repositories verwendet.
 */
export interface User {
  id: number;
  email: string;
  username: string;
  password_hash?: string;
  bio?: string | null;
  profileImage?: string | null;
}

/**
 * Schema für das öffentliche Nutzerprofil in API Antworten.
 * Enthält keine sensitiven Felder wie Passwort Hash oder E-Mail.
 *
 * @param following Gibt an, ob der anfragende Nutzer diesem Profil folgt (optional)
 */
export const ProfileDtoSchema = z.object({
  username: z.string(),
  bio: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  following: z.boolean().optional(),
});

export type ProfileDto = z.infer<typeof ProfileDtoSchema>;
