import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// username is the login handle and is intentionally immutable; password is
// changed via the reset flow, not here.
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'username'] as const),
) {}
