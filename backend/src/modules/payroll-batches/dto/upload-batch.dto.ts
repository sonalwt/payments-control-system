import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UploadBatchDto {
  @IsUUID()
  legalEntityId!: string;

  @IsString()
  @IsNotEmpty()
  periodLabel!: string;

  @IsString()
  @IsNotEmpty()
  currencyCode!: string;
}
