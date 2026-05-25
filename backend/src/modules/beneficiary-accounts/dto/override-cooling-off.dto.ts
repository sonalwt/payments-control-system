import { IsNotEmpty, IsString } from 'class-validator';

/** POST /beneficiary-accounts/:id/override-cooling-off */
export class OverrideCoolingOffDto {
  /** Mandatory justification for bypassing the cooling-off period (§6.3). */
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
