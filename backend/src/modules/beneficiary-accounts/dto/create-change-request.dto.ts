import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChangeRequestDocumentDto {
  @IsString() @IsNotEmpty() documentCode!: string;
  @IsString() @IsNotEmpty() fileName!: string;
  @IsString() @IsNotEmpty() fileUrl!: string;
  @IsString() @IsOptional() mimeType?: string;
}

export class CreateChangeRequestDto {
  @IsEnum(['ADD', 'MODIFY', 'DEACTIVATE'])
  changeType!: 'ADD' | 'MODIFY' | 'DEACTIVATE';

  /** Required for MODIFY / DEACTIVATE. */
  @IsUUID() @IsOptional()
  beneficiaryAccountId?: string;

  /** For ADD: full proposed account data. For MODIFY: fields to change. */
  @IsObject()
  proposedData!: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChangeRequestDocumentDto)
  documents!: ChangeRequestDocumentDto[];
}
