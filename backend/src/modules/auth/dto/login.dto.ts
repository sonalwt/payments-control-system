import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@pcs.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'changeme123' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  expiresIn!: string;

  @ApiProperty()
  user!: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
}
