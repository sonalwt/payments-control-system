import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  businessUnitId!: string;

  @ApiProperty({ example: 'Treasury' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'TREASURY' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
