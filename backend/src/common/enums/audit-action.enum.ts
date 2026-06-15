export enum AuditAction {
  // Generic CRUD
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',

  // Authentication
  LOGIN = 'LOGIN',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  RESET_PASSWORD = 'RESET_PASSWORD',

  // Payment-request lifecycle
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RESUBMIT = 'RESUBMIT',
  WITHDRAW = 'WITHDRAW',
  CANCEL = 'CANCEL',

  // Treasury Team execution
  TREASURY_SUBMIT = 'TREASURY_SUBMIT',
  TREASURY_CHECK = 'TREASURY_CHECK',
  TREASURY_COMPLETE = 'TREASURY_COMPLETE',
  TREASURY_REJECT = 'TREASURY_REJECT',

  // Documents / attachments
  ATTACH_DOCUMENT = 'ATTACH_DOCUMENT',
  REMOVE_DOCUMENT = 'REMOVE_DOCUMENT',
  UPLOAD = 'UPLOAD',

  // Fallback for any mutating action not mapped above
  ACTION = 'ACTION',
}
