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

export interface Currency {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
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
