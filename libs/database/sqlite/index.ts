/**
 * libs/database/sqlite/index.ts
 *
 * Re-exportiert alle öffentlichen Symbole des SQLite Datenbankpakets.
 * Dient als zentraler Einstiegspunkt für den Import von PrismaClient
 * und dem DBService aus dem restlichen Monorepo.
 */

export * from '@prisma/client';
export * from './src/db.service';
