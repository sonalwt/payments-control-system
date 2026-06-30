import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { AttachDocumentDto } from './create-payment-request.dto';

/**
 * Body for POST /employee/payment-requests. The employee identity, request
 * origin, payment direction and request type are all derived server-side
 * from the authenticated employee — they are deliberately NOT accepted from
 * the client. Only a self-service-flagged payment type may be chosen.
 */
export class CreateEmployeeReimbursementDto {
  @ApiProperty({ description: 'Must be a payment type flagged employee_self_service.' })
  @IsUUID()
  paymentTypeId!: string;

  @ApiProperty()
  @IsUUID()
  currencyId!: string;

  @ApiPropertyOptional({ description: "One of the employee's own beneficiary accounts." })
  @IsOptional()
  @IsUUID()
  beneficiaryAccountId?: string;

  @ApiProperty({ example: '1250.0000' })
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, { message: 'Amount must be a positive decimal with up to 4 decimal places' })
  amount!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purposeDescription?: string;

  @ApiPropertyOptional({ type: [AttachDocumentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachDocumentDto)
  documents?: AttachDocumentDto[];
}
