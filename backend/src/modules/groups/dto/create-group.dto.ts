import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateGroupDto {
  @ApiProperty({ example: 'Acme Holdings' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiProperty({ example: 'ACME' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: 'code must be uppercase alphanumeric (with - or _)',
  })
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
