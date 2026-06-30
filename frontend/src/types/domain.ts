export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditFields {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  httpMethod: string;
  path: string;
  statusCode?: number | null;
  success: boolean;
  params?: Record<string, unknown> | null;
  requestBody?: Record<string, unknown> | null;
  errorMessage?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  durationMs?: number | null;
  createdAt: string;
}

export interface Currency extends AuditFields {
  name: string;
  isActive: boolean;
  // Optional legacy attributes — present on seeded rows from the original
  // ISO 4217 master; not collected by the simplified SUPER_ADMIN form.
  code?: string | null;
  numericCode?: string | null;
  minorUnit?: number;
  symbol?: string | null;
  isSystem?: boolean;
}

export interface Group extends AuditFields {
  name: string;
  code: string;
  description?: string | null;
}

export interface LegalEntity extends AuditFields {
  name: string;
  code: string;
  countryId?: string | null;
  country?: Country | null;
  isActive: boolean;
  // Optional richer-org fields — present on legacy/seeded rows, not set by
  // the SUPER_ADMIN master form.
  groupId?: string;
  group?: Group;
  registeredCountry?: string;
  baseCurrencyId?: string;
  baseCurrency?: Currency;
  approvalMatrixRef?: string | null;
  taxIdentifier?: string | null;
}

export interface Country extends AuditFields {
  countryName: string;
  countryShortName: string;
  code: string;
  currencyId: string;
  currency?: Currency | null;
  isActive: boolean;
  isSanctioned: boolean;
  // Optional legacy aliases — preserved on rows that used the older
  // master shape. Prefer the canonical field names above.
  name?: string;
  shortName?: string | null;
  isoCode?: string;
  legalEntityId?: string;
  legalEntity?: LegalEntity;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
}

export interface User extends AuditFields {
  email: string;
  fullName: string;
  employeeCode?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  roles?: string[];
  legalEntities?: string[];
}

export interface UserEntityRole {
  id: string;
  userId: string;
  legalEntityId: string;
  roleId: string;
  legalEntity?: LegalEntity;
  role?: Role;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  role?: Role;
  createdAt: string;
}

export type PaymentDirection = 'OUTGOING' | 'INCOMING';

export interface FieldConfigItem {
  key: string;
  label: string;
  visible: boolean;
  required: boolean;
  readOnly: boolean;
  sortOrder: number;
  helpText?: string | null;
}

export type CounterpartyRole = 'VENDOR' | 'CUSTOMER' | 'BOTH';

export type TaxIdentifierType =
  | 'TRN'
  | 'GSTIN'
  | 'VAT'
  | 'PAN'
  | 'EIN'
  | 'OTHER';

export interface TaxIdentifier {
  type: TaxIdentifierType;
  value: string;
  label?: string | null;
}

export interface Address {
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode?: string | null;
  isPrimary: boolean;
}

export interface Counterparty extends AuditFields {
  code: string;
  name: string;
  legalName?: string | null;
  role: CounterpartyRole;
  countryId?: string | null;
  country?: Country | null;
  taxIdentifiers: TaxIdentifier[];
  addresses: Address[];
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
  kycDone: boolean;
  // Legacy alias kept for older rows where country was a plain ISO code
  countryCode?: string;
}

export interface Employee extends AuditFields {
  employeeCode: string;
  fullName: string;
  workEmail: string;
  countryOfEmploymentId: string;
  countryOfEmployment?: Country;
  startDate?: string | null;
  endDate?: string | null;
  // Sensitive — returned as '••••' unless the caller holds PAYROLL_PII_ACCESS.
  nationalId?: string | null;
  taxIdentifier?: string | null;
  dateOfBirth?: string | null;
  mobileNumber?: string | null;
  address?: string | null;
  compensationBand?: string | null;
  isActive: boolean;
  // Optional legacy fields — preserved on rows that used the older shape.
  preferredName?: string | null;
  legalEntityId?: string;
  legalEntity?: LegalEntity;
  countryCode?: string;
  baseCurrencyId?: string;
  baseCurrency?: Currency;
  payrollCategory?: string;
  employeeBankAccountId?: string | null;
  // Older alias fields kept for backwards-compat with pages that haven't
  // migrated to the canonical names yet.
  countryId?: string | null;
  country?: Country | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
}

export type ApproverType = 'USER' | 'ROLE';

export interface ApprovalMatrixStep {
  id?: string;
  stepOrder: number;
  approverType: ApproverType;
  approverUserId?: string | null;
  approverRoleId?: string | null;
  approverUser?: User | null;
  approverRole?: Role | null;
  isOptional: boolean;
}

export interface ApprovalMatrixBand {
  id?: string;
  sortOrder: number;
  minAmount: number;
  maxAmount?: number | null;
  steps: ApprovalMatrixStep[];
}

export interface ApprovalMatrix extends AuditFields {
  name: string;
  description?: string | null;
  paymentTypeId: string;
  paymentType?: PaymentType;
  currencyId: string;
  currency?: Currency;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  /** Treasury Team that executes the payment after final approval. */
  ttMode: TtMode;
  /** Role that acts at each Treasury Team stage (required for new matrices). */
  treasuryMakerRoleId?: string | null;
  treasuryMakerRole?: Role | null;
  treasuryCheckerRoleId?: string | null;
  treasuryCheckerRole?: Role | null;
  treasuryAuthoriserRoleId?: string | null;
  treasuryAuthoriserRole?: Role | null;
  bands?: ApprovalMatrixBand[];
  // Legacy alias (older rows / resolved-chain output)
  paymentTypeCode?: string;
}

export interface ResolvedChainStep {
  stepOrder: number;
  approverType: ApproverType;
  approverUserId: string | null;
  approverRoleId: string | null;
  isOptional: boolean;
}

export interface ResolvedChain {
  matrixId: string;
  matrixName: string;
  version: number;
  paymentTypeCode: string;
  currencyCode: string;
  amountMinor: number;
  bandId: string;
  bandMin: number;
  bandMax: number | null;
  steps: ResolvedChainStep[];
}

export interface PaymentType extends AuditFields {
  code: string;
  name: string;
  description?: string | null;
  direction: PaymentDirection;
  requiresApprovalChain: boolean;
  isBatchBased: boolean;
  isConfidential: boolean;
  mobileInitiationOnly: boolean;
  employeeSelfService: boolean;
  allowsCrossCurrency: boolean;
  approvalMatrixRef?: string | null;
  fieldConfig: FieldConfigItem[];
  isSystem: boolean;
  isActive: boolean;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  paymentCategoryId?: string | null;
  paymentCategory?: PaymentCategory | null;
  /** Legal entity UUIDs (multi-select). A type may span several legal entities. */
  legalEntityIds?: string[];
  /** Deprecated denormalised primary legal entity (kept in sync with legalEntityIds[0]). */
  legalEntityId: string;
  legalEntity?: LegalEntity | null;
  /** Maker role UUIDs (multi-select). Any holder of one of these can create requests. */
  makerRoleIds?: string[];
  /** Deprecated denormalised primary maker role (kept in sync with makerRoleIds[0]). */
  makerRoleId?: string | null;
  makerRole?: Role | null;
  checkerRoleId?: string | null;
  checkerRole?: Role | null;
}

// =====================================================================
// Section 2 — Currency, Bank, and Account Master
// =====================================================================

export type FxRateSource = 'OANDA' | 'MANUAL_OVERRIDE' | 'STALE_HELD';

export interface FxRate extends AuditFields {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: string;
  asOfDate: string;
  source: FxRateSource;
  fetchedAt: string;
  providerName?: string | null;
  overrideReason?: string | null;
}

export interface ResolvedFxRate {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: string;
  asOfDate: string;
  effectiveAsOfDate: string;
  source: FxRateSource;
  isStale: boolean;
  lastUpdated: string;
  providerName: string | null;
  overrideReason: string | null;
}

export interface Bank extends AuditFields {
  name: string;
  shortName?: string | null;
  countryId: string;
  country?: Country | null;
  swiftBic?: string | null;
  isActive: boolean;
  // Legacy aliases
  countryCode?: string;
  address?: string | null;
}

export type BankAccountType = 'CURRENT' | 'COLLATERAL' | 'DEPOSIT';
export type BalanceSource =
  | 'SEEDED'
  | 'SYSTEM_COMPUTED'
  | 'STATEMENT_RECONCILED'
  | 'MANUAL_OVERRIDE';

export interface AccountType extends AuditFields {
  name: string;
  isActive: boolean;
}

export interface PaymentCategory extends AuditFields {
  name: string;
  isActive: boolean;
}

export interface BankAccountChargeBand {
  id?: string;
  sortOrder?: number;
  minAmount: number;
  maxAmount?: number | null;
  percentage: number;
}

export interface BankAccount extends AuditFields {
  bankId?: string | null;
  bank?: Bank | null;
  bankNickname?: string | null;
  currencyId: string;
  currency?: Currency;
  accountNumber: string;
  branchName?: string | null;
  branchCode?: string | null;
  openingBalance: number | string;
  minimumBalance: number | string;
  remainingBalance: number | string;
  isChairmanDesignated: boolean;
  isActive: boolean;
  // Tiered bank charges by amount band (e.g. 0–1000 → 2%, 1000+ → 5%).
  chargeBands?: BankAccountChargeBand[];
  // Account-type master FK + joined master row
  accountTypeId?: string | null;
  accountTypeMaster?: AccountType | null;
  // §1.3 - Counterparty owner (counterparty bank accounts only).
  counterpartyId?: string | null;
  counterparty?: Counterparty | null;
  // Legacy fields preserved for older consumers (statements, reconciliation, etc.)
  bankName?: string | null;
  nickname?: string;
  accountType?: BankAccountType;
  legalEntityId?: string;
  legalEntity?: LegalEntity;
  iban?: string | null;
  balance?: string;
  balanceAsOf?: string;
  balanceSource?: BalanceSource;
}

export type BalanceChangeKind =
  | 'PAYMENT_DEBIT'
  | 'RECEIPT_CREDIT'
  | 'STATEMENT_RESET'
  | 'MANUAL_OVERRIDE'
  | 'PAYMENT_CORRECTION';

export interface BalanceChange {
  id: string;
  accountId: string;
  kind: BalanceChangeKind;
  previousBalance: string;
  newBalance: string;
  delta: string;
  reason?: string | null;
  paymentRequestId?: string | null;
  receiptId?: string | null;
  statementUploadId?: string | null;
  changedBy?: string | null;
  createdAt: string;
}

export interface IndicativeEquivalent {
  isCrossCurrency: boolean;
  sourceAccountId: string;
  sourceCurrencyCode: string;
  paymentCurrencyCode: string;
  paymentAmount: string;
  indicativeSourceAmount: string;
  rateUsed: string;
  rateAsOfDate: string;
  rateIsStale: boolean;
  disclosureNote: string;
  minimumBalanceOk: boolean;
  minimumBalanceMessage?: string;
}

export interface SanctionedCountry extends AuditFields {
  countryCode: string;
  countryName: string;
  reason: string;
  isActive: boolean;
}

// =====================================================================
// Section 3 — Payment Lifecycle
// =====================================================================

export type PaymentRequestStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'TREASURY_MAKER'
  | 'TREASURY_CHECKER'
  | 'TREASURY_AUTHORISER'
  | 'TREASURY_SWIFT'
  | 'AWAITING_CLOSURE'
  | 'COMPLETED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED';

/** Treasury-Team execution mode, selected on the approval matrix. */
export type TtMode = 'ONLINE_TT' | 'OFFLINE_TT';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PaymentRequestApproval {
  id: string;
  paymentRequestId: string;
  stepOrder: number;
  approverType: 'USER' | 'ROLE';
  approverUserId?: string | null;
  approverUser?: User | null;
  approverRoleId?: string | null;
  approverRole?: Role | null;
  decision: ApprovalDecision;
  decidedBy?: string | null;
  decidedByUser?: User | null;
  decidedAt?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RejectionStage =
  | 'APPROVAL'
  | 'TREASURY_MAKER'
  | 'TREASURY_CHECKER'
  | 'TREASURY_AUTHORISER';

export interface PaymentRequestRejectionSnapshot {
  requestNumber?: string;
  paymentType?: { code: string; name: string } | null;
  legalEntity?: { code: string; name: string } | null;
  currencyCode?: string | null;
  amount?: string;
  counterpartyName?: string | null;
  employeeName?: string | null;
  beneficiary?: { name: string; accountNumber: string } | null;
  sourceAccount?: { bank?: string | null; accountNumber: string } | null;
  invoiceNumber?: string | null;
  dueDate?: string | null;
  purposeDescription?: string | null;
  treasuryReferenceNumber?: string | null;
  treasuryCheckerComments?: string | null;
  swiftCopyUrl?: string | null;
  documents?: { documentCode: string; documentLabel?: string | null; fileName: string; fileUrl: string }[];
  approvals?: {
    stepOrder: number;
    approverType: 'USER' | 'ROLE';
    approver?: string | null;
    decision: ApprovalDecision;
    decidedBy?: string | null;
    decidedAt?: string | null;
    comments?: string | null;
  }[];
}

export interface PaymentRequestRejection {
  id: string;
  paymentRequestId: string;
  stage: RejectionStage;
  stepOrder?: number | null;
  attemptNo: number;
  rejectedBy?: string | null;
  rejectedByUser?: User | null;
  reason?: string | null;
  snapshot?: PaymentRequestRejectionSnapshot | null;
  rejectedAt: string;
}

export interface PaymentRequestDocument {
  id: string;
  paymentRequestId: string;
  documentCode: string;
  documentLabel?: string | null;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  uploadedBy?: string | null;
  uploadedAt: string;
  createdAt: string;
}

// -----------------------------------------------------------------------
// Section 6 — Beneficiary Master
// -----------------------------------------------------------------------

export type BeneficiaryAccountStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
export type ChangeRequestType = 'ADD' | 'MODIFY' | 'DEACTIVATE';
export type ChangeRequestStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BeneficiaryAccount extends AuditFields {
  counterpartyId?: string | null;
  counterparty?: Counterparty | null;
  employeeId?: string | null;
  employee?: Employee | null;
  accountHolderName: string;
  accountNumber: string;
  bankId: string;
  bank?: Bank;
  branchName?: string | null;
  swiftBic?: string | null;
  iban?: string | null;
  currencyId: string;
  currency?: Currency;
  countryId: string;
  country?: Country;
  status: BeneficiaryAccountStatus;
  coolingOffUntil?: string | null;
  /** §1.3 — Direction tag: pay-to (outgoing), receive-from (incoming), or both. */
  accountDirection: 'PAY_TO' | 'RECEIVE_FROM' | 'BOTH';
}

export interface BeneficiaryAccountChangeRequest extends AuditFields {
  beneficiaryAccountId?: string | null;
  beneficiaryAccount?: BeneficiaryAccount | null;
  changeType: ChangeRequestType;
  status: ChangeRequestStatus;
  proposedData: Record<string, unknown>;
  documents: Array<{ code: string; label: string; fileName: string; fileUrl: string; mimeType?: string | null }>;
  requestedBy: string;
  requestedByUser?: User;
  requestedAt: string;
  verifiedBy?: string | null;
  verifiedByUser?: User | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  /** §6.2 — Free-text record of the independent verification call. */
  callbackEvidence?: string | null;
  approvedBy?: string | null;
  approvedByUser?: User | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedByUser?: User | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  coolingOffOverride: boolean;
  coolingOffOverrideReason?: string | null;
}

// -----------------------------------------------------------------------

export interface PaymentRequest extends AuditFields {
  requestNumber: string;
  paymentTypeId: string;
  paymentType?: PaymentType;
  counterpartyId?: string | null;
  counterparty?: Counterparty | null;
  employeeId?: string | null;
  employee?: Employee | null;
  beneficiaryAccountId?: string | null;
  beneficiaryAccount?: BeneficiaryAccount | null;
  /** Legal entity chosen by the maker (from the payment type's entities). */
  legalEntityId?: string | null;
  legalEntity?: LegalEntity | null;
  /** Source bank account — picked by the Treasury Maker, not the initiator. */
  sourceAccountId?: string | null;
  sourceAccount?: BankAccount | null;
  currencyId: string;
  currency?: Currency;
  amount: string;
  purposeDescription?: string | null;
  invoiceNumber?: string | null;
  dueDate?: string | null;
  status: PaymentRequestStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  releasedAt?: string | null;
  paidAt?: string | null;
  matrixId?: string | null;
  currentStepOrder?: number | null;
  bankReference?: string | null;
  valueDate?: string | null;
  proofOfPaymentUrl?: string | null;
  // Treasury Team execution (post final-approval)
  ttMode?: TtMode | null;
  // Role pinned to each treasury stage (snapshotted from the matrix).
  treasuryMakerRoleId?: string | null;
  treasuryMakerRole?: Role | null;
  treasuryCheckerRoleId?: string | null;
  treasuryCheckerRole?: Role | null;
  treasuryAuthoriserRoleId?: string | null;
  treasuryAuthoriserRole?: Role | null;
  treasuryReferenceNumber?: string | null;
  /** Online TT document (PDF) uploaded by the maker at submit. */
  ttDocumentUrl?: string | null;
  swiftCopyUrl?: string | null;
  treasuryMakerBy?: string | null;
  treasuryMakerByUser?: User | null;
  treasuryMakerAt?: string | null;
  treasuryCheckerBy?: string | null;
  treasuryCheckerByUser?: User | null;
  treasuryCheckerAt?: string | null;
  treasuryCheckerComments?: string | null;
  treasuryAuthoriserBy?: string | null;
  treasuryAuthoriserByUser?: User | null;
  treasuryAuthoriserAt?: string | null;
  treasurySwiftBy?: string | null;
  treasurySwiftByUser?: User | null;
  treasurySwiftAt?: string | null;
  completedAt?: string | null;
  sanctionWarning: boolean;
  sanctionOverrideReason?: string | null;
  /** §6.4 — anomaly flag set at submit time (does not block the payment). */
  anomalyFlag: boolean;
  anomalyNotes?: string | null;
  /** §1.3/§4.2 — Snapshot of counterparty frozen at submission time. */
  counterpartySnapshot?: Record<string, unknown> | null;
  /** §4.2 — Snapshot of beneficiary account frozen at submission time. */
  beneficiarySnapshot?: Record<string, unknown> | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  withdrawnReason?: string | null;
  approvals?: PaymentRequestApproval[];
  documents?: PaymentRequestDocument[];
  rejections?: PaymentRequestRejection[];
  /** Maker who created the request — joined for the "Worked on by" column. */
  createdByUser?: { id: string; fullName: string; email: string } | null;
}

// -----------------------------------------------------------------------
// Section 7 — Incoming Receipts (separate domain; not a PaymentRequest)
// -----------------------------------------------------------------------

export type IncomingReceiptStatus =
  | 'DRAFT'
  | 'AWAITING_RECEIPT'
  | 'RECEIVED'
  | 'CANCELLED';

export interface IncomingReceiptDocument {
  id: string;
  incomingReceiptId: string;
  documentCode: string;
  documentLabel?: string | null;
  fileName: string;
  fileUrl: string;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  uploadedBy?: string | null;
  uploadedAt: string;
  createdAt: string;
}

export interface IncomingReceipt extends AuditFields {
  receiptNumber: string;
  legalEntityId: string;
  legalEntity?: LegalEntity;
  counterpartyId: string;
  counterparty?: Counterparty;
  receiveFromAccountId: string;
  receiveFromAccount?: BankAccount;
  expectedAmount: string;
  expectedCurrencyCode: string;
  purposeDescription?: string | null;
  receivedFromAccount?: string | null;
  status: IncomingReceiptStatus;
  submittedAt?: string | null;
  receivedAt?: string | null;
  receivedAmount?: string | null;
  receivedCurrencyCode?: string | null;
  inwardBankReference?: string | null;
  receivedRemarks?: string | null;
  cancellationReason?: string | null;
  documents?: IncomingReceiptDocument[];
}

// -----------------------------------------------------------------------
// Section 7 (legacy heading) — Proof-of-Payment Exception Reports
// -----------------------------------------------------------------------

export interface ExceptionReportItem {
  id: string;
  reportId: string;
  paymentRequestId: string;
  requestNumber: string;
  legalEntityName?: string | null;
  currencyCode: string;
  amount: string;
  paidAt: string;
  createdAt: string;
}

export interface ExceptionReport {
  id: string;
  reportDate: string;
  totalMissing: number;
  generatedAt: string;
  createdAt: string;
  items?: ExceptionReportItem[];
}

// -----------------------------------------------------------------------
// Section 8 — Bank Statement Uploads
// -----------------------------------------------------------------------

export type StatementIngestionStatus =
  | 'UPLOADED'
  | 'PARSED'
  | 'PARSE_FAILED'
  | 'MATCHED';

export type StatementIngestionFormat = 'CSV' | 'PDF';

export interface StatementUpload {
  id: string;
  bankAccountId: string;
  bankAccount?: BankAccount;
  statementDate: string;
  openingBalance: string;
  closingBalance: string;
  fileUrl: string;
  rowCount: number;
  notes?: string | null;
  uploadedBy: string;
  uploader?: { id: string; fullName: string; email: string } | null;
  createdAt: string;
  // §8 reconciliation summary (all optional; populated by reconciliation module).
  ingestionStatus?: StatementIngestionStatus | null;
  ingestionFormat?: StatementIngestionFormat | null;
  ingestionError?: string | null;
  autoMatchCompletedAt?: string | null;
  matchedCount?: number | null;
  candidateCount?: number | null;
  exceptionCount?: number | null;
}

// -----------------------------------------------------------------------
// §8 — Statement lines & reconciliation exceptions
// -----------------------------------------------------------------------

export type StatementLineDirection = 'DEBIT' | 'CREDIT';
export type StatementLineMatchStatus =
  | 'UNMATCHED'
  | 'CANDIDATE'
  | 'MATCHED'
  | 'EXCEPTION';

export interface StatementLine {
  id: string;
  statementUploadId: string;
  bankAccountId: string;
  lineIndex: number;
  valueDate: string;
  postingDate?: string | null;
  direction: StatementLineDirection;
  amount: string;
  currencyCode: string;
  bankReference?: string | null;
  counterpartyText?: string | null;
  narrative?: string | null;
  runningBalance?: string | null;
  matchStatus: StatementLineMatchStatus;
  matchedPaymentRequestId?: string | null;
  matchedPaymentRequest?: PaymentRequest | null;
  matchedIncomingReceiptId?: string | null;
  matchedIncomingReceipt?: IncomingReceipt | null;
  matchScore?: string | null;
  matchReason?: string | null;
  matchedAt?: string | null;
  matchedBy?: string | null;
  exceptionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ReconciliationExceptionType =
  | 'UNAUTHORISED_PAYMENT'
  | 'UNIDENTIFIED_RECEIPT';

export type ReconciliationExceptionStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'RESOLVED_WITH_JUSTIFICATION'
  | 'CONFIRMED_EXCEPTION';

export interface ReconciliationException {
  id: string;
  exceptionNumber: string;
  statementUploadId: string;
  statementUpload?: StatementUpload;
  statementLineId: string;
  statementLine?: StatementLine;
  bankAccountId: string;
  bankAccount?: BankAccount;
  exceptionType: ReconciliationExceptionType;
  status: ReconciliationExceptionStatus;
  amount: string;
  currencyCode: string;
  valueDate: string;
  bankReference?: string | null;
  counterpartyText?: string | null;
  narrative?: string | null;
  resolutionNote?: string | null;
  investigatedBy?: string | null;
  investigatedAt?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMe {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  entityIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: { id: string; email: string; fullName: string; roles: string[] };
}

// =====================================================================
// Section 5 — Payroll Batches
// =====================================================================

export type PayrollBatchStatus =
  | 'VALIDATION_FAILED'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface PayrollBatchItem {
  id: string;
  batchId: string;
  employeeId: string;
  employee?: Employee;
  beneficiaryAccountId?: string | null;
  beneficiaryAccount?: BeneficiaryAccount | null;
  grossAmountMinor: number;
  netAmountMinor: number;
  deductionsMinor: number;
  payslipUrl?: string | null;
  varianceFlag: boolean;
  previousNetMinor?: number | null;
  variancePct?: number | null;
  paymentRequestId?: string | null;
  createdAt: string;
}

export interface PayrollBatch extends AuditFields {
  batchNumber: string;
  legalEntityId: string;
  legalEntity?: LegalEntity;
  periodLabel: string;
  currencyCode: string;
  totalGrossMinor: number;
  totalNetMinor: number;
  employeeCount: number;
  varianceFlag: boolean;
  headcountDelta?: number | null;
  sanityNotes?: string | null;
  status: PayrollBatchStatus;
  fileUrl: string;
  uploadedBy?: string | null;
  submittedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  items?: PayrollBatchItem[];
}

// =====================================================================
// Section 5 — Employee Bank Account Change Control
// =====================================================================

export type EbacChangeType = 'ADD' | 'MODIFY' | 'DEACTIVATE';
export type EbacStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface EmployeeBankAccountChange extends AuditFields {
  employeeId: string;
  employee?: Employee;
  changeType: EbacChangeType;
  status: EbacStatus;
  proposedData: Record<string, unknown>;
  documents: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;
  anomalyFlag: boolean;
  anomalyNotes?: string | null;
  requestedBy: string;
  requester?: { id: string; fullName: string; email: string };
  verifiedBy?: string | null;
  verifier?: { id: string; fullName: string; email: string } | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  callbackEvidence?: string | null;
  approvedBy?: string | null;
  approver?: { id: string; fullName: string; email: string } | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejector?: { id: string; fullName: string; email: string } | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

// ── Delegations ──────────────────────────────────────────────────────────────

export interface Delegation {
  id: string;
  delegatorId: string;
  delegator: { id: string; fullName: string; email: string };
  delegateeId: string;
  delegatee: { id: string; fullName: string; email: string };
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  userId: string;
  type: 'DELEGATION_ASSIGNED' | 'DELEGATION_CANCELLED';
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unreadCount: number;
export interface PrMessageAttachment {
  url: string;
  fileName: string;
}

export interface PrMessage {
  id: string;
  paymentRequestId: string;
  senderId: string;
  recipientId: string | null;
  message: string;
  attachments: PrMessageAttachment[];
  createdAt: string;
  sender: { id: string; fullName: string; email: string };
  recipient?: { id: string; fullName: string; email: string } | null;
}

export interface PrParticipant {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
