import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChairmanCrDocumentDto {
  @IsString() @IsNotEmpty() documentCode!: string;
  @IsString() @IsNotEmpty() fileName!: string;
  @IsString() @IsNotEmpty() fileUrl!: string;
  @IsString() @IsOptional() mimeType?: string;
}

export class CreateChairmanCrDto {
  @IsEnum(['ADD', 'MODIFY', 'DEACTIVATE'])
  changeType!: 'ADD' | 'MODIFY' | 'DEACTIVATE';

  /** Required for MODIFY / DEACTIVATE. */
  @IsUUID() @IsOptional()
  chairmanBeneficiaryId?: string;

  /** For ADD: full proposed account data. For MODIFY: fields to change. */
  @IsObject()
  proposedData!: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChairmanCrDocumentDto)
  documents!: ChairmanCrDocumentDto[];
}
