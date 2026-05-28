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
  @ApiProperty({ example: 'FIN' })
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must contain only uppercase letters, digits, underscore or hyphen',
  })
  code!: string;

  @ApiProperty({ example: 'Finance' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ description: 'Legal entity master UUID' })
  @IsUUID()
  legalEntityId!: string;

  @ApiProperty({ description: 'Business unit master UUID' })
  @IsUUID()
  businessUnitId!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
