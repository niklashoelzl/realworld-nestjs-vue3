/**
 * profiles.controller.ts
 *
 * HTTP Controller für den /profiles Endpunkt.
 * Verwaltet Profilabfragen, Autor Suche, Abonnements sowie
 * Follow und Unfollow Aktionen. Authentifizierung ist beim
 * Profilabruf optional, bei allen anderen Routen erforderlich.
 */

import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { ProfilesService } from './profiles.service';
import { JwtGuard } from '../auth/jwt.guard';
import { OptionalJwtGuard } from '../auth/OptionalJwt.guard';

@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) { }

  /**
   * Durchsucht Autoren nach Username oder E-Mail.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param query Suchbegriff (Standard leerer String)
   * @param limit Maximale Anzahl an Ergebnissen als String (Standard 10, max 25)
   * @returns Objekt mit `profiles` Array der gefundenen Autoren
   */
  @Get('search')
  @UseGuards(JwtGuard)
  searchAuthors(@Query('q') query = '', @Query('limit') limit = '10') {
    return this.profilesService.searchAuthors(query, Number(limit));
  }

  /**
   * Gibt alle Autoren zurück, denen der eingeloggte Nutzer folgt.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @returns Objekt mit `profiles` Array der abonnierten Autoren
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   */
  @Get('subscriptions')
  @UseGuards(JwtGuard)
  getSubscriptions(@Request() req: any) {
    if (!req.user?.userId) {
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    }

    return this.profilesService.getSubscriptions(req.user.userId);
  }

  /**
   * Gibt das Profil eines Nutzers anhand seines Usernames zurück.
   * Authentifizierung ist optional. Bei eingeloggten Nutzern wird
   * `following` korrekt befüllt.
   *
   * @param username URL Parameter des gesuchten Nutzers
   * @param req Request Objekt mit optionalem Nutzer (`req.user?.userId`)
   * @returns Objekt mit `profile` des gefundenen Nutzers
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   */
  @Get(':username')
  @UseGuards(OptionalJwtGuard)
  getProfileByUsername(
    @Param('username') username: string,
    @Request() req: any,
  ) {
    return this.profilesService.getProfileByUsername(
      username,
      req.user?.userId,
    );
  }

  /**
   * Folgt einem Nutzer anhand seines Usernames.
   * Idempotent, mehrfaches Aufrufen hat keinen zusätzlichen Effekt.
   * Antwortet mit HTTP 200.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param username URL Parameter des zu folgenden Nutzers
   * @returns Objekt mit dem aktualisierten `profile` (following: true)
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   * @throws BadRequestException wenn der Nutzer sich selbst folgen möchte
   */
  @Post(':username/follow')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  followUser(@Request() req: any, @Param('username') username: string) {
    if (!req.user?.userId) {
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    }

    return this.profilesService.followByUsername(req.user.userId, username);
  }

  /**
   * Entfolgt einem Nutzer anhand seines Usernames.
   * Idempotent, wenn kein Abonnement existiert, passiert nichts.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param username URL Parameter des zu entfolgenden Nutzers
   * @returns Objekt mit dem aktualisierten `profile` (following: false)
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   * @throws NotFoundException wenn kein Nutzer mit dem Username existiert
   */
  @Delete(':username/follow')
  @UseGuards(JwtGuard)
  unfollowUser(@Request() req: any, @Param('username') username: string) {
    if (!req.user?.userId) {
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    }

    return this.profilesService.unfollowByUsername(req.user.userId, username);
  }
}
