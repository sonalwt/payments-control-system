import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Country } from '../countries/country.entity';
import { Department } from '../departments/department.entity';

@Entity({ name: 'employees' })
export class Employee extends BaseEntity {
  @Column({ name: 'employee_code', type: 'varchar', length: 50 })
  employeeCode!: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName!: string;

  @Column({ name: 'work_email', type: 'citext' })
  workEmail!: string;

  @Column({ name: 'country_of_employment_id', type: 'uuid' })
  countryOfEmploymentId!: string;

  @ManyToOne(() => Country)
  @JoinColumn({ name: 'country_of_employment_id' })
  countryOfEmployment?: Country;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: string | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ name: 'national_id', type: 'varchar', length: 50, nullable: true })
  nationalId?: string | null;

  @Column({ name: 'tax_identifier', type: 'varchar', length: 50, nullable: true })
  taxIdentifier?: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Column({ name: 'mobile_number', type: 'varchar', length: 30, nullable: true })
  mobileNumber?: string | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ name: 'compensation_band', type: 'varchar', length: 20, nullable: true })
  compensationBand?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
