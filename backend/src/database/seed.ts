import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User } from '../modules/users/user.entity';
import { Role } from '../modules/roles/role.entity';
import { UserEntityRole } from '../modules/user-entity-roles/user-entity-role.entity';
import { LegalEntity } from '../modules/legal-entities/legal-entity.entity';

/**
 * Idempotent bootstrap: seeds a SUPER_ADMIN user. If a legal entity exists,
 * the user is assigned SUPER_ADMIN against the first one. Otherwise the
 * user is created but assignment is skipped — assignments can be made via
 * /user-entity-roles once entities exist.
 *
 * Usage:
 *   ADMIN_EMAIL=admin@pcs.local ADMIN_PASSWORD=ChangeMe123! npm run seed
 */
async function run(): Promise<void> {
  await dataSource.initialize();
  const email = process.env.ADMIN_EMAIL ?? 'admin@pcs.local';
  const password = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  const users = dataSource.getRepository(User);
  const roles = dataSource.getRepository(Role);
  const uerRepo = dataSource.getRepository(UserEntityRole);
  const legalEntities = dataSource.getRepository(LegalEntity);

  const adminRole = await roles.findOne({ where: { code: 'SUPER_ADMIN' } });
  if (!adminRole) {
    throw new Error('SUPER_ADMIN role missing — apply schema.sql first');
  }

  let user = await users.findOne({ where: { email } });
  if (!user) {
    user = users.create({
      email,
      fullName: 'System Administrator',
      passwordHash: await bcrypt.hash(password, 12),
      isActive: true,
      isPlatformAdmin: true,
    });
    user = await users.save(user);
    // eslint-disable-next-line no-console
    console.log(`Created platform admin ${email} / ${password}`);
  } else {
    if (!user.isPlatformAdmin) {
      user.isPlatformAdmin = true;
      await users.save(user);
    }
    // eslint-disable-next-line no-console
    console.log(`Admin user ${email} already exists`);
  }

  const firstLE = await legalEntities.findOne({ where: {}, order: { createdAt: 'ASC' } });
  if (firstLE) {
    const existing = await uerRepo.findOne({
      where: { userId: user.id, legalEntityId: firstLE.id, roleId: adminRole.id },
    });
    if (!existing) {
      await uerRepo.save(
        uerRepo.create({
          userId: user.id,
          legalEntityId: firstLE.id,
          roleId: adminRole.id,
          isActive: true,
          effectiveFrom: new Date(),
        }),
      );
      // eslint-disable-next-line no-console
      console.log(`Assigned SUPER_ADMIN against legal entity ${firstLE.name}`);
    }
  } else {
    // eslint-disable-next-line no-console
    console.log('No legal entity yet — assignment skipped.');
  }

  await dataSource.destroy();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
