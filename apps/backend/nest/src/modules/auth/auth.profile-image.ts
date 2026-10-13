/**
 * auth.profile-image.ts
 *
 * DTO für den Upload eines Profilbilds.
 * Enthält das Base64 kodierte Bild als einziges Pflichtfeld.
 */

import { IsString, IsNotEmpty } from 'class-validator';

export class UploadProfileImageDto {
  /**
   * Base64 kodierter Inhalt des Profilbilds.
   */
  @IsString()
  @IsNotEmpty()
  imageData!: string;
}
