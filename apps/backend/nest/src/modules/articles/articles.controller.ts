/**
 * articles.controller.ts
 *
 * HTTP Controller für den /articles Endpunkt.
 * Nimmt eingehende Requests entgegen, validiert die Eingaben per Zod Schema
 * und delegiert die Logik an den ArticlesService.
 * Authentifizierung erfolgt wahlweise per JwtGuard (erforderlich) oder
 * OptionalJwtGuard (optional, für öffentlich lesbare Routen).
 */

import {
  BadRequestException,
  UnprocessableEntityException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
  Request,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtGuard } from '../auth/jwt.guard';
import {
  ArticlesFeedQueryDtoSchema,
  ArticlesQueryDtoSchema,
  CreateArticleDtoSchema,
  UpdateArticleDtoSchema,
  zodToErrorResponse,
} from '@common/model';
import { z } from 'zod';
import { OptionalJwtGuard } from '../auth/OptionalJwt.guard';

@Controller('/articles')
export class ArticlesController {
  constructor(private readonly articleService: ArticlesService) { }

  /**
   * Erstellt einen neuen Artikel.
   * Erwartet den Artikel Payload unter `body.article`.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param dto Request Body, der unter `dto.article` die Artikeldaten enthält
   * @returns Das erstellte Artikel Objekt eingehüllt in `{ article }`
   */
  @Post('')
  @UseGuards(JwtGuard)
  async createArticle(@Request() req, @Body() dto: any) {
    const result = CreateArticleDtoSchema.safeParse(dto.article);

    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));

    const article = await this.articleService.createArticle(result.data, req.user.userId);
    return { article };
  }

  /**
   * Gibt eine Liste aller Artikel zurück (Global Feed).
   * Unterstützt optionale Filterparameter (author, tag, favorited) sowie
   * Paginierung (limit, offset).
   * Authentifizierung ist optional. Bei eingeloggten Nutzern wird
   * `favorited` und `following` korrekt befüllt.
   *
   * @param req Request Objekt mit optionalem Nutzer (`req.user?.userId`)
   * @param query Query Parameter gemäß `ArticlesQueryDtoSchema`
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  @Get('')
  @UseGuards(OptionalJwtGuard)
  getRecentArticles(@Request() req, @Query() query: unknown) {
    const result = ArticlesQueryDtoSchema.safeParse(query);

    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));
    return this.articleService.getArticlesGlobal(result.data, req.user?.userId);
  }

  /**
   * Gibt den personalisierten Feed des eingeloggten Nutzers zurück.
   * Enthält nur Artikel von Autoren, denen der Nutzer folgt.
   * Nur für authentifizierte Nutzer zugänglich.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param query Query Parameter gemäß `ArticlesFeedQueryDtoSchema` (limit, offset)
   * @returns Objekt mit `articles` Array und `articlesCount`
   */
  @Get('/feed')
  @UseGuards(JwtGuard)
  getUserFeed(@Request() req, @Query() query: unknown) {
    const result = ArticlesFeedQueryDtoSchema.safeParse(query);

    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));

    return this.articleService.getUserFeed(req.user.userId, result.data);
  }

  /**
   * Gibt einen einzelnen Artikel anhand seines Slugs zurück.
   * Authentifizierung ist optional. Bei eingeloggten Nutzern wird
   * `favorited` und `following` korrekt befüllt.
   *
   * @param slug URL Parameter; muss dem Muster `/^[a-z0-9-]+$/` entsprechen
   * @param req Request Objekt mit optionalem Nutzer (`req.user?.userId`)
   * @returns Das gefundene Artikel Objekt eingehüllt in `{ article }`
   * @throws BadRequestException bei ungültigem Slug Format
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Get(':slug')
  @UseGuards(OptionalJwtGuard)
  async getArticlebySlug(@Param('slug') slug: string, @Request() req) {
    const result = z
      .string()
      .regex(/^[a-z0-9-]+$/, 'Ungültiger Slug')
      .safeParse(slug);

    if (result.error)
      throw new BadRequestException({ errors: { body: [`Invalid slug: ${slug}`] } });

    const article = await this.articleService.getArticleBySlug(result.data, req.user?.userId);
    return { article };
  }

  /**
   * Aktualisiert einen bestehenden Artikel anhand seines Slugs.
   * Erwartet die zu ändernden Felder unter `body.article`.
   * Nur der Autor des Artikels darf ihn bearbeiten.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param slug URL Parameter; Slug des zu aktualisierenden Artikels
   * @param dto Request Body, der unter `dto.article` die aktualisierten Daten enthält
   * @returns Der aktualisierte Artikel eingehüllt in `{ article }`
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor ist
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Put(':slug')
  @UseGuards(JwtGuard)
  async updateArticle(@Request() req, @Param('slug') slug: string, @Body() dto: any) {
    const result = UpdateArticleDtoSchema.safeParse(dto.article);

    if (result.error)
      throw new UnprocessableEntityException(zodToErrorResponse(result.error));

    const article = await this.articleService.updateArticle(
      slug,
      result.data,
      req.user.userId,
    );
    return { article };
  }

  /**
   * Löscht einen Artikel anhand seines Slugs.
   * Nur der Autor des Artikels darf ihn löschen.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param slug URL Parameter; Slug des zu löschenden Artikels
   * @throws UnauthorizedException wenn der Nutzer nicht der Autor ist
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Delete(':slug')
  @UseGuards(JwtGuard)
  deleteArticle(@Request() req, @Param('slug') slug: string) {
    return this.articleService.deleteArticle(slug, req.user.userId);
  }

  /**
   * Fügt einem Artikel einen Like hinzu für den eingeloggten Nutzer.
   * Idempotent mehrfaches Aufrufen hat keinen zusätzlichen Effekt.
   * Antwortet mit HTTP 200.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param slug URL Parameter; Slug des zu likenden Artikels
   * @returns Der aktualisierte Artikel eingehüllt in `{ article }`
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Post(':slug/favorite')
  @HttpCode(200)
  @UseGuards(JwtGuard)
  async favoriteArticle(@Request() req, @Param('slug') slug: string) {
    const article = await this.articleService.favoriteArticle(slug, req.user.userId);
    return { article };
  }

  /**
   * Entfernt einem Artikel den Like des eingeloggten Nutzers.
   * Idempotent wenn der Artikel nicht geliked war, passiert nichts.
   *
   * @param req Request Objekt mit dem eingeloggten Nutzer (`req.user.userId`)
   * @param slug URL Parameter; Slug des zu unlikenden Artikels
   * @returns Der aktualisierte Artikel eingehüllt in `{ article }`
   * @throws NotFoundException wenn kein Artikel mit dem Slug existiert
   */
  @Delete(':slug/favorite')
  @UseGuards(JwtGuard)
  async unFavoriteArticle(@Request() req, @Param('slug') slug: string) {
    const article = await this.articleService.unFavoriteArticle(slug, req.user.userId);
    return { article };
  }
}
