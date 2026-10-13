/**
 * libs/database/sqlite/src/db.service.ts
 *
 * Kapselt die Initialisierung und den Zugriff auf den Prisma Client
 * mit SQLite Adapter (better-sqlite3).
 *
 * Die Klasse `DBService` stellt eine Verbindung zur Datenbank her
 * und gibt den fertig konfigurierten PrismaClient nach außen frei.
 * Sie wird typischerweise beim Modulstart einmalig initialisiert
 * und als Singleton im NestJS DI Container bereitgestellt.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

export class DBService {
  private prisma!: PrismaClient;

  /**
   * Stellt die Verbindung zur SQLite Datenbank her.
   * Initialisiert den `PrismaBetterSqlite3` Adapter mit der
   * Datenbankpfad URL aus der Umgebungsvariable `DATABASE_URL`
   * und erstellt anschließend den PrismaClient.
   *
   * Muss vor dem ersten Zugriff auf `client` aufgerufen werden.
   */
  async connect() {
    const adapter = new PrismaBetterSqlite3({
      url: process.env.DATABASE_URL ?? '',
    });

    this.prisma = new PrismaClient({ adapter });

    await this.prisma.$connect();
  }

  /**
   * Gibt den initialisierten PrismaClient zurück.
   * Wirft einen Fehler, falls `connect()` noch nicht aufgerufen wurde.
   *
   * @returns Der aktive PrismaClient
   */
  get client() {
    return this.prisma;
  }
}
