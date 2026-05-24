import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { LegalEntity } from '../legal-entities/legal-entity.entity';
import { Currency } from '../currencies/currency.entity';

@Entity({ name: 'employees' })
@Unique('uq_employee_code_per_entity', ['legalEntityId', 'employeeCode'])
@Index('idx_employees_legal_entity', ['legalEntityId'])
@Index('idx_employees_country', ['countryCode'])
@Index('idx_employees_active', ['isActive'])
export class Employee extends BaseEntity {
  @Column({ name: 'employee_code', type: 'varchar', length: 40 })
  employeeCode!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ name: 'preferred_name', type: 'varchar', length: 150, nullable: true })
  preferredName?: string | null;

  @Column({ name: 'work_email', type: 'citext', nullable: true })
  workEmail?: string | null;

  @ManyToOne(() => LegalEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'legal_entity_id' })
  legalEntity!: LegalEntity;

  @Column({ name: 'legal_entity_id', type: 'uuid' })
  legalEntityId!: string;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @ManyToOne(() => Currency, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'base_currency_id' })
  baseCurrency!: Currency;

  @Column({ name: 'base_currency_id', type: 'uuid' })
  baseCurrencyId!: string;

  @Column({ name: 'payroll_category', type: 'varchar', length: 40 })
  payrollCategory!: string;

  @Column({ name: 'employee_bank_account_id', type: 'uuid', nullable: true })
  employeeBankAccountId?: string | null;

  @Column({ name: 'employment_start_date', type: 'date', nullable: true })
  employmentStartDate?: string | null;

  @Column({ name: 'employment_end_date', type: 'date', nullable: true })
  employmentEndDate?: string | null;

  // Sensitive — masked at the API layer unless caller holds PAYROLL_PII_ACCESS.
  @Column({ name: 'national_id', type: 'varchar', length: 60, nullable: true })
  nationalId?: string | null;

  @Column({ name: 'tax_identifier', type: 'varchar', length: 60, nullable: true })
  taxIdentifier?: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Column({ name: 'compensation_band', type: 'varchar', length: 40, nullable: true })
  compensationBand?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
