import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreatePaymentCategoryDto {
  @ApiProperty({ example: 'Trade Payments' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
