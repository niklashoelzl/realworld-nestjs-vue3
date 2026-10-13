/**
 * libs/database/index.ts
 *
 * Wurzel Einstiegspunkt des `database` Pakets im Monorepo.
 * Delegiert sämtliche Exporte an das SQLite Unterpaket,
 * sodass Konsumenten nur `@common/database` importieren müssen.
 */

export * from './sqlite/index';
