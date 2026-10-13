/**
 * comments.controller.ts
 *
 * HTTP Controller für den /articles/:slug/comments Endpunkt.
 * Nimmt eingehende Requests entgegen, validiert die Eingaben per Zod Schema
 * und delegiert die Logik an den CommentsService.
 * Authentifizierung ist beim Lesen optional, beim Erstellen und Löschen erforderlich.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtGuard } from '../auth/jwt.guard';
import { OptionalJwtGuard } from '../auth/OptionalJwt.guard';
import { CreateCommentDtoSchema, zodToErrorResponse } from '@common/model';

@Controller('/articles/:slug/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  /**
   * Gibt alle Kommentare eines Artikels zurück.
   * Authentifizierung ist optional. Bei eingeloggten Nutzern wird
   * `following` am Autor Profil korrekt befüllt.
   *
   * @param slug URL Parameter des zugehörigen Artikels
   * @param req Request Objekt mit optionalem Nutzer (`req.user?.userId`)
   * @returns Objekt mit `comments` Array
   */
  @Get()
  @UseGuards(OptionalJwtGuard)
  getComments(@Param('slug') slug: string, @Request() req) {
    return this.commentsService.getComments(slug, req.user?.userId);
  }

  /**
   * Erstellt einen neuen Kommentar zu einem Artikel.
   * Erwartet den Kommentar Payload unter `body.comment`.
   * Nur für authentifizierte Nutzer zugänglich.
   * Antwortet mit HTTP 200.
   *
   * @param slug URL Parameter des zugehörigen Artikels
   * @param dto Request Body mit dem Kommentar unter `dto.comment`
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @returns Das erstellte Kommentar Objekt eingehüllt in `{ comment }`
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Post()
  @UseGuards(JwtGuard)
  @HttpCode(200)
  async createComment(@Param('slug') slug: string, @Body() dto: any, @Request() req) {
    const result = CreateCommentDtoSchema.safeParse(dto.comment);

    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));

    const comment = await this.commentsService.createComment(
      slug,
      result.data,
      req.user.userId,
    );
    return { comment };
  }

  /**
   * Löscht einen Kommentar anhand seiner ID.
   * Nur der Autor des Kommentars darf ihn löschen.
   *
   * @param slug URL Parameter des zugehörigen Artikels
   * @param id URL Parameter der Kommentar ID (als String, wird zu Number konvertiert)
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @throws UnprocessableEntityException wenn die ID keine gültige Zahl ist
   * @throws NotFoundException wenn Artikel oder Kommentar nicht gefunden wurden
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor des Kommentars ist
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  deleteComment(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Request() req,
  ) {
    const commentId = Number(id);

    if (Number.isNaN(commentId)) {
      throw new UnprocessableEntityException({
        errors: {
          body: [`id must be a number`],
        },
      });
    }

    return this.commentsService.deleteComment(slug, commentId, req.user.userId);
  }
}
