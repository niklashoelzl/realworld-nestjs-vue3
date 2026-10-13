/**
 * articles.module.ts
 *
 * NestJS Modul für den Artikelbereich.
 * Bündelt Controller, Service und Repository des Artikelmoduls und
 * importiert das AuthModule für die JWT Authentifizierung.
 * Das ArticleRepository wird exportiert, damit andere Module
 * (z. B. CommentsModule) darauf zugreifen können.
 */

import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { AuthModule } from '../auth/auth.modules';
import { ArticlesService } from './articles.service';
import { ArticleRepository } from './articles.repository';

@Module({
  imports: [AuthModule],
  controllers: [ArticlesController],
  providers: [ArticlesService, ArticleRepository],
  exports: [ArticleRepository],
})
export class ArticlesModule {}
