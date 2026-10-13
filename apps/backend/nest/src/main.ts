/**
 * main.ts
 *
 * Einstiegspunkt der NestJS Anwendung.
 * Erstellt die App Instanz, konfiguriert CORS für die erlaubten Frontend Origins,
 * setzt das globale API Präfix und startet den HTTP Server.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

const PORT = process.env.PORT ?? 3000;

/**
 * Initialisiert und startet die NestJS Anwendung.
 * CORS ist für localhost:5173 und localhost:8080 aktiviert.
 * Alle Routen sind unter dem Präfix `/api` erreichbar.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
  });

  app.setGlobalPrefix('/api');

  await app.listen(PORT);

  Logger.log(`Server listening on http://localhost:${PORT}`);
}

bootstrap();
