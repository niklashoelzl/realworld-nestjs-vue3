/**
 * libs/model/error.model.ts
 *
 * Gemeinsame Fehlerklassen und Hilfsfunktionen für die Fehlerbehandlung
 * im gesamten Monorepo.
 * Stellt sowohl typisierte Fehlerklassen als auch eine Konvertierungsfunktion
 * für Zod Validierungsfehler in das RealWorld konforme API Fehlerformat bereit.
 */

import type { ZodError } from 'zod';

/**
 * Fehler für den Fall, dass eine angeforderte Ressource nicht gefunden wurde.
 * Entspricht semantisch einem HTTP 404. Wird im Service geworfen und
 * im Controller oder einem globalen Exception Filter in eine
 * `NotFoundException` umgewandelt.
 */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Konvertiert einen Zod Validierungsfehler in das RealWorld API Fehlerformat.
 * Das resultierende Objekt kann direkt als Response Body einer
 * `UnprocessableEntityException` oder `BadRequestException` verwendet werden.
 *
 * @param error Der von Zod zurückgegebene `ZodError`
 * @returns Objekt im Format `{ errors: { body: string[] } }`
 */
export function zodToErrorResponse(error: ZodError) {
  return {
    errors: {
      body: error.issues.map((issue) => issue.message),
    },
  };
}
