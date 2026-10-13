/**
 * OptionalJwt.guard.ts
 *
 * Guard für öffentlich lesbare Routen mit optionaler Authentifizierung.
 * Lässt Anfragen ohne Token durch (req.user bleibt null), wertet aber
 * einen gültigen Token aus, sodass authentifizierte Nutzer personalisierte
 * Daten (geliked, following) erhalten.
 */

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  /**
   * Überschreibt den Standard Error Handler des JWT Guards.
   * Gibt null zurück statt eine Exception zu werfen, wenn kein
   * oder ein ungültiger Token übergeben wurde.
   *
   * @param err Fehler aus der Token Verifikation
   * @param user Dekodierter Nutzer oder null
   * @param info Zusätzliche Passport Informationen
   * @param context Aktueller Execution Context
   * @returns Den authentifizierten Nutzer oder null
   */
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
