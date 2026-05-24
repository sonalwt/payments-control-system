import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBankAccountDto } from './create-bank-account.dto';

// Identity fields (legalEntity, bank, currency, accountNumber, accountType,
// openingBalance) are immutable post-creation; they would change the
// account's meaning. Update the descriptive / minimum-balance fields only.
export class UpdateBankAccountDto extends PartialType(
  OmitType(CreateBankAccountDto, [
    'legalEntityId',
    'bankId',
    'currencyId',
    'accountNumber',
    'accountType',
    'openingBalance',
  ] as const),
) {}
