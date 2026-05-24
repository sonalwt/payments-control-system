import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString, Length } from 'class-validator';

export class BalanceOverrideDto {
  @ApiProperty({ example: '128450.5500' })
  @IsNumberString()
  newBalance!: string;

  @ApiProperty({
    example:
      'Manual reset to reflect inward wire credited intra-day; bank advice attached out-of-band.',
  })
  @IsString()
  @Length(5, 1000)
  reason!: string;
}
