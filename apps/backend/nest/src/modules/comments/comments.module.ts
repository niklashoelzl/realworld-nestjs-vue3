/**
 * comments.module.ts
 *
 * NestJS Modul für den Kommentarbereich.
 * Importiert das AuthModule für die JWT Authentifizierung sowie das
 * ArticlesModule, um über das ArticleRepository Artikel per Slug aufzulösen.
 */

import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { AuthModule } from '../auth/auth.modules';
import { CommentsService } from './comments.service';
import { CommentsRepository } from './comments.repository';
import { ArticlesModule } from '../articles/articles.module';

@Module({
  imports: [AuthModule, ArticlesModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
})
export class CommentsModule { }
