/**
 * app.module.ts
 *
 * Wurzel Modul der NestJS Anwendung.
 * Importiert alle Feature Module und das globale Datenbank Modul.
 * Der Datenbankpfad wird relativ zum kompilierten Output Verzeichnis aufgelöst.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.modules';
import { DbModule } from './modules/db/db.module';
import { resolve } from 'node:path';
import 'dotenv/config';
import { UsersModule } from './modules/users/users.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { CommentsModule } from './modules/comments/comments.module';
import { TagsModule } from './modules/tags/tags.module';

const dbPath = `file:${resolve(__dirname, '../dev.db')}`;

console.log('Database Path:', dbPath);

@Module({
  imports: [
    DbModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ArticlesModule,
    CommentsModule,
    TagsModule,
  ],
})
export class AppModule { }
