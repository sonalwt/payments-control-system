import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsDefined,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

/**
 * A document the invoicing app already has stored (typically the invoice PDF).
 * PCS stores the URL — it does not fetch or re-host the file.
 */
export class InvoiceWebhookDocumentDto {
  @ApiProperty({ example: 'INV-2026-0442.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  fileName!: string;

  @ApiProperty({ example: 'https://invoicing.example.com/files/INV-2026-0442.pdf' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  @Matches(/^https?:\/\//i, { message: 'fileUrl must be an http(s) URL' })
  fileUrl!: string;

  @ApiPropertyOptional({ example: 'INVOICE', default: 'INVOICE' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  documentCode?: string;

  @ApiPropertyOptional({ example: 'Vendor invoice' })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  documentLabel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSizeBytes?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}

/**
 * The supplier's bank account as printed on the invoice.
 *
 * PCS matches it against the beneficiary master and links the account when it
 * finds exactly one. It never creates a beneficiary from these details — that
 * would bypass KYC and the cooling-off window. When nothing matches, the
 * details are carried onto the draft so the maker can act on them.
 */
export class SupplierBankAccountDto {
  @ApiProperty({ example: 'Acme Trading L.L.C.' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  accountName!: string;

  /** At least one of accountNumber / iban must identify the account. */
  @ApiPropertyOptional({ example: '01234567890' })
  @ValidateIf((o: SupplierBankAccountDto) => !o.iban)
  @IsString()
  @IsNotEmpty({ message: 'accountNumber is required unless iban is supplied.' })
  @Length(1, 60)
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'AE070331234567890123456' })
  @ValidateIf((o: SupplierBankAccountDto) => !o.accountNumber)
  @IsString()
  @IsNotEmpty({ message: 'iban is required unless accountNumber is supplied.' })
  @Length(1, 34)
  iban?: string;

  @ApiPropertyOptional({ example: 'EBILAEAD' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  swiftBic?: string;

  @ApiPropertyOptional({ example: 'Emirates NBD' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  bankName?: string;

  @ApiPropertyOptional({ example: 'Deira Branch' })
  @IsOptional()
  @IsString()
  @Length(1, 120)
  branchName?: string;

  @ApiPropertyOptional({ example: 'AE' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;
}

/**
 * Payload posted by the invoicing application. Everything is identified by
 * **name** — the upstream system holds no PCS identifiers. Each name is
 * resolved against the PCS masters on receipt (see InvoiceNameResolver); an
 * unmatched or ambiguous name is reported back as a 422 rather than guessed.
 */
export class InvoiceWebhookDto {
  // ── Idempotency ────────────────────────────────────────────────────
  @ApiProperty({
    description:
      'The invoicing app\'s own id for this invoice. Replaying the same id returns the request already created instead of raising a duplicate payment.',
    example: 'INV-2026-0442',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  externalInvoiceId!: string;

  @ApiProperty({
    description: 'Name of the sending system. Scopes the idempotency key.',
    example: 'INVOICING',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  externalSystem!: string;

  // ── Names resolved against the PCS masters ─────────────────────────
  // Note: no payment type. It selects the approval matrix — who authorises the
  // payment — so it is chosen by a PCS maker on the draft, never by the sender.

  @ApiProperty({
    description: 'Currency code or name, e.g. "AED" or "UAE Dirham".',
    example: 'AED',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  currency!: string;

  /**
   * The payee. This integration carries supplier invoices only — employee
   * payments (payroll, reimbursement, FnF) are raised in PCS itself, so a
   * counterparty is always the payee here.
   */
  @ApiProperty({
    description: 'Vendor / counterparty name as it appears on the invoice.',
    example: 'Acme Trading LLC',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  counterpartyName!: string;

  @ApiProperty({
    description: 'Legal entity the invoice is billed to, by name or code.',
    example: 'First Economy FZE',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  legalEntityName!: string;

  @ApiProperty({
    type: SupplierBankAccountDto,
    description: "The supplier's bank account exactly as printed on the invoice.",
  })
  // IsDefined/IsObject are load-bearing: ValidateNested alone lets a missing or
  // non-object value through, and the resolver would then dereference undefined.
  @IsDefined({ message: 'supplierBankAccount is required.' })
  @IsObject({ message: 'supplierBankAccount must be an object.' })
  @ValidateNested()
  @Type(() => SupplierBankAccountDto)
  supplierBankAccount!: SupplierBankAccountDto;

  // ── Invoice detail ─────────────────────────────────────────────────
  @ApiProperty({ description: 'Invoice gross amount payable.', example: '12500.00' })
  @Transform(({ value }) => (typeof value === 'number' ? String(value) : value))
  @IsString()
  @Matches(/^\d+(\.\d{1,4})?$/, {
    message: 'amount must be a positive decimal with up to 4 decimal places',
  })
  amount!: string;

  @ApiProperty({
    description:
      'Invoice number. Spaces and unsupported characters are normalised (PCS allows A-Z 0-9 - _ / only).',
    example: 'INV-2026-0442',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 80)
  invoiceNumber!: string;

  /** The only optional field on the payload — not every invoice carries terms. */
  @ApiPropertyOptional({ example: '2026-09-15' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({
    description:
      'Trade deal this invoice settles, as referenced in the upstream system. Recorded on the request so makers and approvers can tie the payment back to the deal.',
    example: 'DL-2026-0042',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  dealId!: string;

  @ApiPropertyOptional({
    description:
      'Free-text description of what the payment is for. Optional — the deal reference above already identifies the payment.',
  })
  @IsOptional()
  @IsString()
  purposeDescription?: string;

  @ApiProperty({
    type: [InvoiceWebhookDocumentDto],
    description: 'At least one document — normally the invoice PDF.',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one document (the invoice) must be attached.' })
  @ValidateNested({ each: true })
  @Type(() => InvoiceWebhookDocumentDto)
  documents!: InvoiceWebhookDocumentDto[];

  // No autoSubmit: a request cannot be submitted until it has a payment type,
  // and only a PCS maker may choose one. Submission is always a human act.
}
