import { Check, Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

/**
 * SOW §2.3 — Bank Master.
 *
 * Banks with which the group holds relationships. The (name, countryCode)
 * tuple is unique within the live set so two branches of the same bank in
 * different countries can each carry their own SWIFT/BIC and address.
 */
@Entity({ name: 'banks' })
@Unique('uq_banks_name_country', ['name', 'countryCode'])
@Index('idx_banks_country', ['countryCode'])
@Index('idx_banks_active', ['isActive'])
@Check('chk_banks_country', `country_code ~ '^[A-Z]{2}$'`)
@Check('chk_banks_swift', `swift_bic IS NULL OR swift_bic ~ '^[A-Z0-9]{8}([A-Z0-9]{3})?$'`)
export class Bank extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ name: 'short_name', type: 'varchar', length: 50, nullable: true })
  shortName?: string | null;

  @Column({ name: 'country_code', type: 'char', length: 2 })
  countryCode!: string;

  @Column({ name: 'swift_bic', type: 'varchar', length: 11, nullable: true })
  swiftBic?: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
