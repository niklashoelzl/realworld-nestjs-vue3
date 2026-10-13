/**
 * tags.module.ts
 *
 * NestJS Modul für den Tag Bereich.
 * Bündelt Controller, Service und Repository des Tag Moduls.
 */

import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TagsRepository } from './tags.repository';

@Module({
  controllers: [TagsController],
  providers: [TagsService, TagsRepository],
})
export class TagsModule { }
