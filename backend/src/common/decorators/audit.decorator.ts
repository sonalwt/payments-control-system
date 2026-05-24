import { SetMetadata } from '@nestjs/common';
import { AUDIT_ENTITY_KEY } from '../interceptors/audit.interceptor';

/** Tag a controller (or handler) with the logical entity type for audit logging. */
export const Audit = (entityType: string) => SetMetadata(AUDIT_ENTITY_KEY, entityType);
