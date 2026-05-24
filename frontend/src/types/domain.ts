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
