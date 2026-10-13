/**
 * users.controller.ts
 *
 * HTTP Controller für Nutzer und Authentifizierungs Endpunkte.
 * Verwaltet Registrierung, Login, Profilabfrage und Profilaktualisierung
 * sowie Passwortänderung und Profilbild Upload.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Request,
  UnauthorizedException,
  UseGuards,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';
import { UsersService } from './users.service';
import { LoginDtoSchema, RegisterDtoSchema, zodToErrorResponse } from '@common/model';

@Controller('')
export class UsersController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) { }

  /**
   * Gibt das Profil des eingeloggten Nutzers zurück (GET /user).
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @returns User Objekt mit email, token, username, bio und image
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   */
  @Get('user')
  @UseGuards(JwtGuard)
  async getMe(@Request() req: any) {
    if (!req.user?.userId)
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    return this.usersService.getProfile(req.user.userId);
  }

  /**
   * Aktualisiert das Profil des eingeloggten Nutzers (PUT /user).
   * Erwartet die Felder unter `body.user` oder direkt im Body.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param body Request Body mit optionalen Feldern username, email und bio
   * @returns Aktualisiertes User Objekt mit frisch signiertem Token
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   * @throws BadRequestException wenn die E-Mail bereits vergeben ist
   */
  @Put('user')
  @UseGuards(JwtGuard)
  async updateProfile(@Request() req: any, @Body() body: any) {
    if (!req.user?.userId)
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    const data = body?.user ?? body;
    return this.usersService.updateProfile(req.user.userId, data);
  }

  /**
   * Lädt ein Profilbild als Base64 Data URL hoch (POST /users/profile-image).
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param body Request Body mit dem Base64 kodierten Bild unter `imageData`
   * @returns Aktualisiertes User Objekt mit dem neuen Profilbild
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   * @throws BadRequestException wenn `imageData` fehlt
   */
  @Post('users/profile-image')
  @UseGuards(JwtGuard)
  async uploadProfileImage(
    @Request() req: any,
    @Body() body: { imageData: string },
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    }

    if (!body.imageData) {
      throw new BadRequestException({ errors: { body: ['Missing imageData'] } });
    }

    return this.usersService.uploadProfileImage(req.user.userId, body.imageData);
  }

  /**
   * Registriert einen neuen Nutzer (POST /users).
   * Erwartet die Felder unter `body.user` oder direkt im Body.
   * Antwortet mit HTTP 201.
   *
   * @param dto Request Body mit email, username und password
   * @returns User Objekt mit email, token, username, bio und image
   * @throws UnprocessableEntityException bei Validierungsfehlern
   * @throws BadRequestException wenn die E-Mail bereits registriert ist
   */
  @Post('users')
  @HttpCode(201)
  register(@Body() dto: unknown) {
    const body = (dto as any)?.user ?? dto;
    const result = RegisterDtoSchema.safeParse(body);
    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));
    return this.authService.register(result.data);
  }

  /**
   * Meldet einen bestehenden Nutzer an (POST /users/login).
   * Erwartet die Felder unter `body.user` oder direkt im Body.
   *
   * @param dto Request Body mit email und password
   * @returns User Objekt mit email, token, username, bio und image
   * @throws UnprocessableEntityException bei Validierungsfehlern
   * @throws UnauthorizedException wenn E-Mail oder Passwort ungültig sind
   */
  @Post('users/login')
  login(@Body() dto: unknown) {
    const body = (dto as any)?.user ?? dto;
    const result = LoginDtoSchema.safeParse(body);
    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));
    return this.authService.login(result.data);
  }

  /**
   * Ändert das Passwort des eingeloggten Nutzers (PUT /user/password).
   * Prüft das aktuelle Passwort und validiert das neue Passwort auf Mindestlänge.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param body Request Body mit `currentPassword` und `newPassword`
   * @returns Erfolgsmeldung als Objekt
   * @throws UnauthorizedException wenn kein gültiger Token vorliegt
   * @throws BadRequestException wenn das aktuelle Passwort falsch oder das neue zu kurz ist
   */
  @Put('user/password')
  @UseGuards(JwtGuard)
  async changePassword(
    @Request() req: any,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!req.user?.userId)
      throw new UnauthorizedException({ errors: { body: ['Invalid token'] } });
    await this.usersService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Passwort erfolgreich geändert' };
  }
}
