/**
 * tags.controller.ts
 *
 * HTTP Controller für den /tags Endpunkt.
 * Gibt alle verfügbaren Tags alphabetisch sortiert zurück.
 * Öffentlich zugänglich, keine Authentifizierung erforderlich.
 */

import { Controller, Get } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller()
export class TagsController {
  constructor(private readonly tagsService: TagsService) { }

  /**
   * Gibt alle vorhandenen Tags zurück.
   *
   * @returns Objekt mit `tags` Array aller Tag Namen
   */
  @Get('tags')
  getTags() {
    return this.tagsService.getTags();
  }
}
