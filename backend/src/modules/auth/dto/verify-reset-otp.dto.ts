import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyResetOtpDto {
  @ApiProperty({ example: 'jane.doe@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit code relayed by an admin' })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class VerifyResetOtpResponseDto {
  @ApiProperty({ description: 'Short-lived token that unlocks the reset-password window' })
  token!: string;
}
