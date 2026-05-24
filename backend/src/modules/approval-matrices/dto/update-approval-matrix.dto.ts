import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateApprovalMatrixDto } from './create-approval-matrix.dto';

// payment_type_code and version cannot move once the matrix exists.
// To create a v2, post a new matrix for the same payment_type_code; the
// publish call supersedes the prior PUBLISHED row.
export class UpdateApprovalMatrixDto extends PartialType(
  OmitType(CreateApprovalMatrixDto, ['paymentTypeCode'] as const),
) {}
