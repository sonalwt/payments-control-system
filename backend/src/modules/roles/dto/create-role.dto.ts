import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'CUSTOM_ROLE' })
  @IsString()
  @Length(2, 50)
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  code!: string;

  @ApiProperty({ example: 'Custom Role' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
