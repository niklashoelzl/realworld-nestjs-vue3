/**
 * tags.service.ts
 *
 * Logik Schicht für Tags.
 * Delegiert Datenbankzugriffe an das TagsRepository und verpackt
 * die Ergebnisse in die erwartete Response Struktur.
 */

import { Injectable } from '@nestjs/common';
import { TagsRepository } from './tags.repository';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) { }

  /**
   * Gibt alle vorhandenen Tags zurück.
   *
   * @returns Objekt mit `tags` Array aller Tag Namen
   */
  async getTags(): Promise<{ tags: string[] }> {
    const tags = await this.tagsRepository.getTags();

    return { tags };
  }
}
