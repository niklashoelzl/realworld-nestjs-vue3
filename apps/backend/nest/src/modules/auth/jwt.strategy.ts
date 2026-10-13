/**
 * jwt.strategy.ts
 *
 * Passport Strategie zur JWT Verifikation.
 * Liest den Token aus dem Authorization Header im Format `Token <jwt>`
 * und verifiziert ihn gegen den konfigurierten
 * JWT Secret. Das validierte Payload wird als `req.user` bereitgestellt.
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import 'dotenv/config';

/**
 * Extrahiert den JWT Token aus dem Authorization Header.
 * Erwartet das Format `Token <jwt>` statt des Standard Formats `Bearer <jwt>`.
 *
 * @returns Extractor Funktion die den Token aus dem Request ausliest oder null zurückgibt
 */
function fromAuthHeaderAsToken() {
  return (req: Request): string | null => {
    const authHeader = req.headers?.authorization;
    if (!authHeader) return null;
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Token' || !token) return null;
    return token;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromAuthHeaderAsToken()]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key-change-in-env',
    });
  }

  /**
   * Wird nach erfolgreicher Token Verifikation aufgerufen.
   * Mappt das JWT Payload auf das `req.user` Objekt.
   *
   * @param payload Dekodiertes JWT Payload mit sub (userId) und email
   * @returns Objekt mit userId und email das als `req.user` verfügbar ist
   */
  validate(payload: { sub: number; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
