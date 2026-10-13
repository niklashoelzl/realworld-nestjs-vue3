/**
 * tags.repository.ts
 *
 * Datenbankzugriffsschicht für Tags.
 * Kapselt alle Prisma Abfragen bzgl. des Tag Modells.
 */

import { Injectable } from '@nestjs/common';
import { DBService } from '@common/database';

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DBService) { }

  /**
   * Gibt den Prisma Client zurück.
   */
  private get prisma() {
    return this.db.client;
  }

  /**
   * Gibt alle vorhandenen Tag Namen alphabetisch sortiert zurück.
   *
   * @returns Array aller Tag Namen als Strings
   */
  async getTags(): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      select: { name: true },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => tag.name);
  }
}
