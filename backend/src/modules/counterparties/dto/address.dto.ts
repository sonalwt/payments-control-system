import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Registered Office' })
  @IsString()
  @Length(1, 60)
  label!: string;

  @ApiProperty({ example: '1 Marina Boulevard' })
  @IsString()
  @Length(1, 200)
  line1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 200)
  line2?: string | null;

  @ApiProperty({ example: 'Singapore' })
  @IsString()
  @Length(1, 100)
  city!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  state?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string | null;

  @ApiProperty({ description: 'Exactly one address must be marked primary.' })
  @IsBoolean()
  isPrimary!: boolean;
}
