import { IsNotEmpty, IsString } from 'class-validator';

export class ChairmanOverrideCoolingOffDto {
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
