import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';
import { MatrixStepDto } from './matrix-step.dto';

export class MatrixBandDto {
  @ApiProperty({ example: 'INR', description: 'ISO 4217' })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, { message: 'currencyCode must be 3 uppercase letters' })
  currencyCode!: string;

  @ApiProperty({
    example: 0,
    description: 'Inclusive lower bound in currency minor units (e.g. paise)',
  })
  @IsInt()
  @Min(0)
  minAmountMinor!: number;

  @ApiPropertyOptional({
    example: 50000000,
    description:
      'Inclusive upper bound in currency minor units. Omit / null for the open-ended top band.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxAmountMinor?: number | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ type: [MatrixStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MatrixStepDto)
  steps!: MatrixStepDto[];
}
