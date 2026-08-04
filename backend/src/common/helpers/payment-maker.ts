import { ForbiddenException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/**
 * Payment-maker eligibility.
 *
 * There is no single "initiator" role — the INITIATOR role was retired when the
 * system moved to maker/checker. A maker is whoever a payment type names as its
 * Maker: either the named user, or the holder of one of its maker roles. That
 * cannot be expressed as a `@Roles(...)` list, so endpoints open the guard and
 * call these helpers instead.
 *
 * Raw SQL (rather than the PaymentType entity) keeps `common` free of a
 * dependency on `modules`. The predicate mirrors `GET /payment-types?mine=true`.
 */
export async function isPaymentMaker(
  manager: EntityManager,
  userId: string,
): Promise<boolean> {
  const rows: unknown[] = await manager.query(
    `SELECT 1
       FROM payment_types pt
      WHERE pt.deleted_at IS NULL
        AND (
          pt.maker_user_id = $1
          OR EXISTS (
            SELECT 1 FROM user_roles ur
             WHERE ur.user_id = $1
               AND (ur.role_id = ANY(pt.maker_role_ids) OR ur.role_id = pt.maker_role_id)
          )
        )
      LIMIT 1`,
    [userId],
  );
  return rows.length > 0;
}

/**
 * Allow the action when the actor holds one of `privilegedRoles` or is a
 * payment maker; otherwise throw 403 with `message`.
 */
export async function assertPaymentMakerOrRole(
  manager: EntityManager,
  actor: AuthenticatedUser,
  privilegedRoles: readonly string[],
  message: string,
): Promise<void> {
  if (actor.roles?.some((r) => privilegedRoles.includes(r))) return;
  if (await isPaymentMaker(manager, actor.id)) return;
  throw new ForbiddenException(message);
}
