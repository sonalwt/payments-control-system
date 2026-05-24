import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class FieldConfigItemDto {
  @ApiProperty({ example: 'invoiceNumber' })
  @IsString()
  @Length(1, 60)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message: 'key must be a camelCase / snake_case identifier',
  })
  key!: string;

  @ApiProperty({ example: 'Invoice Number' })
  @IsString()
  @Length(1, 120)
  label!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  visible!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  required!: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  readOnly!: boolean;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  sortOrder!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  helpText?: string | null;
}
