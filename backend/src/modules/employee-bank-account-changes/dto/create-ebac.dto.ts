import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEbacDto {
  @IsUUID()
  employeeId!: string;

  @IsString()
  @IsIn(['ADD', 'MODIFY', 'DEACTIVATE'])
  changeType!: string;

  @IsObject()
  proposedData!: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  documents?: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;
}
