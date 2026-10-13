/**
 * libs/database/sqlite/prisma.config.ts
 *
 * Prisma Konfigurationsdatei für das SQLite Datenbankpaket.
 * Definiert den Pfad zum Schema sowie die Datenbankverbindung
 * über die Umgebungsvariable `DATABASE_URL`.
 *
 * Wird von der Prisma CLI beim Ausführen von `prisma migrate`
 * und `prisma generate` herangezogen.
 */

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',

  datasource: {
    url: process.env.DATABASE_URL,
  },
});
