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

export interface Currency extends AuditFields {
  code: string;
  name: string;
  numericCode?: string | null;
  minorUnit: number;
  symbol?: string | null;
  isActive: boolean;
  isSystem: boolean;
}

export interface Group extends AuditFields {
  name: string;
  code: string;
  description?: string | null;
}

export interface LegalEntity extends AuditFields {
  groupId: string;
  group?: Group;
  name: string;
  code: string;
  registeredCountry: string;
  baseCurrencyId: string;
  baseCurrency?: Currency;
  approvalMatrixRef?: string | null;
  taxIdentifier?: string | null;
  isActive: boolean;
}

export interface Country extends AuditFields {
  legalEntityId: string;
  legalEntity?: LegalEntity;
  name: string;
  isoCode: string;
  isActive: boolean;
}

export interface BusinessUnit extends AuditFields {
  countryId: string;
  country?: Country;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface Department extends AuditFields {
  businessUnitId: string;
  businessUnit?: BusinessUnit;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
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

export interface DocumentPolicyItem {
  code: string;
  label: string;
  required: boolean;
  amountThresholdMinor?: number | null;
  currencyCode?: string | null;
}

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
  countryCode: string;
  taxIdentifiers: TaxIdentifier[];
  addresses: Address[];
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface Employee extends AuditFields {
  employeeCode: string;
  fullName: string;
  preferredName?: string | null;
  workEmail?: string | null;
  legalEntityId: string;
  legalEntity?: LegalEntity;
  countryCode: string;
  baseCurrencyId: string;
  baseCurrency?: Currency;
  payrollCategory: string;
  employeeBankAccountId?: string | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  // Sensitive — returned as '••••' unless the caller holds PAYROLL_PII_ACCESS.
  nationalId?: string | null;
  taxIdentifier?: string | null;
  dateOfBirth?: string | null;
  compensationBand?: string | null;
  isActive: boolean;
}

export type ApprovalMatrixStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';
export type ApproverType = 'USER' | 'ROLE';

export interface ApprovalMatrixStep {
  id?: string;
  stepOrder: number;
  approverType: ApproverType;
  approverUserId?: string | null;
  approverRoleId?: string | null;
  isOptional: boolean;
}

export interface ApprovalMatrixBand {
  id?: string;
  currencyCode: string;
  minAmountMinor: number;
  maxAmountMinor?: number | null;
  sortOrder?: number;
  steps: ApprovalMatrixStep[];
}

export interface ApprovalMatrix extends AuditFields {
  name: string;
  description?: string | null;
  paymentTypeCode: string;
  version: number;
  status: ApprovalMatrixStatus;
  effectiveFrom: string;
  effectiveTo?: string | null;
  publishedAt?: string | null;
  publishedBy?: string | null;
  isActive: boolean;
  bands?: ApprovalMatrixBand[];
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
  allowsCrossCurrency: boolean;
  approvalMatrixRef?: string | null;
  documentPolicy: DocumentPolicyItem[];
  fieldConfig: FieldConfigItem[];
  isSystem: boolean;
  isActive: boolean;
  version: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
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
  countryCode: string;
  swiftBic?: string | null;
  address?: string | null;
  isActive: boolean;
}

export type BankAccountType = 'CURRENT' | 'COLLATERAL' | 'DEPOSIT';
export type BalanceSource =
  | 'SEEDED'
  | 'SYSTEM_COMPUTED'
  | 'STATEMENT_RECONCILED'
  | 'MANUAL_OVERRIDE';

export interface BankAccount extends AuditFields {
  nickname: string;
  legalEntityId: string;
  legalEntity?: LegalEntity;
  bankId: string;
  bank?: Bank;
  currencyId: string;
  currency?: Currency;
  accountNumber: string;
  iban?: string | null;
  accountType: BankAccountType;
  branchName?: string | null;
  branchCode?: string | null;
  balance: string;
  balanceAsOf: string;
  balanceSource: BalanceSource;
  minimumBalance?: string | null;
  isChairmanDesignated: boolean;
  isActive: boolean;
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
  | 'APPROVED'
  | 'AWAITING_PAYMENT_CONFIRMATION'
  | 'PAID'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED'
  // §9 — Chairman payment execution stages (chain-free).
  | 'AWAITING_MAKER_PREP'
  | 'AWAITING_CHECKER_REVIEW'
  | 'AWAITING_HEAD_APPROVAL';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PaymentRequestApproval {
  id: string;
  paymentRequestId: string;
  stepOrder: number;
  approverType: 'USER' | 'ROLE';
  approverUserId?: string | null;
  approverRoleId?: string | null;
  /** Resolved display name for ROLE-type steps (e.g. "Approver") */
  approverRoleName?: string | null;
  /** Resolved email for USER-type steps */
  approverUserEmail?: string | null;
  /** Resolved full name for USER-type steps */
  approverUserName?: string | null;
  isOptional: boolean;
  decision: ApprovalDecision;
  decidedBy?: string | null;
  decidedAt?: string | null;
  comments?: string | null;
  createdAt: string;
  updatedAt: string;
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
  bankName?: string | null;
  branchName?: string | null;
  swiftBic?: string | null;
  iban?: string | null;
  currencyId: string;
  currency?: Currency;
  countryCode: string;
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
  documents: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;
  requestedBy: string;
  requester?: { id: string; fullName: string; email: string };
  verifiedBy?: string | null;
  verifier?: { id: string; fullName: string; email: string } | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  callbackEvidence?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  /** §6.4 — True when at least one anomaly signal fired on creation. */
  anomalyFlag: boolean;
  /** §6.4 — Pipe-separated list of anomaly signals. */
  anomalyNotes?: string | null;
  /** §6.5 — True when the proposed beneficiary country is sanctioned. */
  sanctionWarning: boolean;
  /** §6.5 — Written acknowledgement from the final approver when sanctionWarning is true. */
  sanctionOverrideReason?: string | null;
}

// -----------------------------------------------------------------------
// Section 9 — Chairman Beneficiary Master
// -----------------------------------------------------------------------

export type ChairmanBeneficiaryStatus = 'PENDING_ACTIVATION' | 'ACTIVE' | 'INACTIVE';
export type ChairmanCrType = 'ADD' | 'MODIFY' | 'DEACTIVATE';
export type ChairmanCrStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

/** A confidential payment beneficiary — no counterparty/employee owner. */
export interface ChairmanBeneficiary extends AuditFields {
  accountHolderName: string;   // may be 'Confidential' when masked by the API
  accountNumber: string;       // may be '****' when masked
  bankId: string;
  bank?: Bank;
  bankName?: string | null;    // may be 'Confidential' when masked
  branchName?: string | null;
  swiftBic?: string | null;
  iban?: string | null;
  currencyId: string;
  currency?: Currency;
  countryCode: string;
  status: ChairmanBeneficiaryStatus;
  coolingOffUntil?: string | null;
  anomalyFlag: boolean;
  anomalyNotes?: string | null;
  sanctionWarning: boolean;
  sanctionOverrideReason?: string | null;
}

export interface ChairmanBeneficiaryChangeRequest extends AuditFields {
  chairmanBeneficiaryId?: string | null;
  chairmanBeneficiary?: ChairmanBeneficiary | null;
  changeType: ChairmanCrType;
  status: ChairmanCrStatus;
  proposedData: Record<string, unknown>;
  documents: Array<{ documentCode: string; fileName: string; fileUrl: string; mimeType?: string }>;
  anomalyFlag: boolean;
  anomalyNotes?: string | null;
  sanctionWarning: boolean;
  sanctionOverrideReason?: string | null;
  requestedBy: string;
  requester?: { id: string; fullName: string; email: string };
  verifiedBy?: string | null;
  verifier?: { id: string; fullName: string; email: string } | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  callbackEvidence?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
}

// -----------------------------------------------------------------------

export interface PaymentRequest extends AuditFields {
  requestNumber: string;
  paymentTypeCode: string;
  legalEntityId: string;
  legalEntity?: LegalEntity;
  counterpartyId?: string | null;
  counterparty?: Counterparty | null;
  employeeId?: string | null;
  employee?: Employee | null;
  currencyCode: string;
  amount: string;
  amountMinor: number;
  purposeDescription?: string | null;
  invoiceNumber?: string | null;
  dueDate?: string | null;
  sourceAccountId?: string | null;
  sourceAccount?: BankAccount | null;
  isCrossCurrency: boolean;
  indicativeSourceAmount?: string | null;
  bankReference?: string | null;
  valueDate?: string | null;
  proofOfPaymentUrl?: string | null;
  status: PaymentRequestStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  matrixId?: string | null;
  matrixVersion?: number | null;
  currentStepOrder?: number | null;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  makerNotes?: string | null;
  beneficiaryAccountId?: string | null;
  beneficiaryAccount?: BeneficiaryAccount | null;
  /** §4.2 — Snapshot of counterparty/employee frozen at submission time. */
  counterpartySnapshot?: Record<string, unknown> | null;
  /** §4.2 — Snapshot of beneficiary account frozen at submission time. */
  beneficiarySnapshot?: Record<string, unknown> | null;
  /**
   * §4.2/§6.5 — True when the beneficiary or counterparty country was on the
   * sanctioned-country list at the time of submission.
   */
  sanctionWarning?: boolean;
  /** §6.5 — Written acknowledgement from the final approver when sanctionWarning is true. */
  sanctionOverrideReason?: string | null;
  /**
   * §2.5/§2.6 — True once this request's debit has been reconciled against an
   * uploaded bank statement. Post-execution amount correction is blocked.
   */
  isAmountLocked?: boolean;
  approvals?: PaymentRequestApproval[];
  documents?: PaymentRequestDocument[];
  // §9 — Chairman payment fields.
  isChairmanPayment?: boolean;
  chairmanBeneficiaryId?: string | null;
  /** Full object when loaded with relations; may be masked for non-execution roles. */
  chairmanBeneficiary?: ChairmanBeneficiary | null;
  makerPreparedAt?: string | null;
  checkerVerifiedAt?: string | null;
  headApprovedAt?: string | null;
  checkerNotes?: string | null;
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
