import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'jane.doe@company.com' })
  @IsEmail()
  workEmail!: string;

  @ApiProperty({ example: '123456', description: 'The 6-digit code from the email.' })
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}

export class EmployeeLoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  expiresIn!: string;

  @ApiProperty()
  employee!: {
    id: string;
    workEmail: string;
    fullName: string;
  };
}
