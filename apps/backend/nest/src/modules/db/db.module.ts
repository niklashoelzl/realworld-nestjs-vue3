/**
 * db.module.ts
 *
 * Globales NestJS Modul für die Datenbankverbindung.
 * Stellt den DBService per useFactory bereit, stellt die Verbindung
 * beim Start her und exportiert den Service für alle anderen Module.
 * Durch @Global() ist kein explizites Import in anderen Modulen nötig.
 */

import { Global, Module } from '@nestjs/common';
import { DBService } from '@common/database';

@Global()
@Module({
  providers: [
    {
      provide: DBService,
      useFactory: async (): Promise<DBService> => {
        const service = new DBService();
        await service.connect();
        return service;
      },
    },
  ],
  exports: [DBService],
})
export class DbModule { }
