/**
 * jwt.guard.ts
 *
 * Guard für geschützte Routen.
 * Blockiert Anfragen ohne gültigen JWT Token und gibt HTTP 401 zurück.
 * Wird per @UseGuards(JwtGuard) auf Controller Ebene eingesetzt.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Erweiterung des Passport JWT Guards.
 * Schützt Routen, die eine Authentifizierung voraussetzen.
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') { }
